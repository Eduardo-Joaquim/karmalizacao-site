import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getD1 } from "@/db";
import { normalizeCharacterPayload } from "@/lib/character-data";
import { characterRevision } from "@/lib/character-revision";
import {
  calculateAutomaticBonuses,
  getVowErrors,
  validateVowTransition,
} from "@/lib/character-rules";
import {
  characterPayloadSchema,
  saveCharacterSchema,
} from "@/lib/character-schema";
import { mergeCombat } from "@/lib/combat-engine";
import { readJsonBody, RequestBodyError } from "@/lib/request-body";

export const dynamic = "force-dynamic";

const privateHeaders = { "Cache-Control": "private, no-store", Vary: "Cookie" };
function json(data: unknown, init: ResponseInit = {}) {
  return Response.json(data, {
    ...init,
    headers: { ...privateHeaders, ...init.headers },
  });
}

type CharacterRow = {
  id: string;
  name: string;
  payload: string;
  createdAt: string;
  updatedAt: string;
};

function unauthorized() {
  return json({ error: "Autenticação necessária" }, { status: 401 });
}

export async function GET(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return unauthorized();

  try {
    const database = await getD1();
    const requestedId = new URL(request.url).searchParams.get("id");
    if (requestedId) {
      if (!/^[a-zA-Z0-9-]{12,80}$/.test(requestedId))
        return json({ error: "Identificador inválido." }, { status: 400 });
      const row = await database
        .prepare(
          `SELECT id, name, payload, created_at AS createdAt, updated_at AS updatedAt
         FROM characters WHERE id = ? AND owner_email = ? LIMIT 1`,
        )
        .bind(requestedId, user.email)
        .first<CharacterRow>();
      if (!row)
        return json({ error: "Ficha não encontrada." }, { status: 404 });
      if (new URL(request.url).searchParams.get("export") === "raw")
        return new Response(row.payload, {
          headers: {
            ...privateHeaders,
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="ficha-${row.id}.json"`,
          },
        });
      const payload = normalizeCharacterPayload(
        characterPayloadSchema.parse(JSON.parse(row.payload)),
      );
      return json({
        character: {
          ...row,
          payload,
          revision: await characterRevision(payload),
        },
      });
    }

    const cursor = new URL(request.url).searchParams.get("cursor");
    let after: { time: string; id: string } | null = null;
    if (cursor) {
      try {
        after = JSON.parse(atob(cursor));
        if (
          !after ||
          typeof after.time !== "string" ||
          typeof after.id !== "string"
        )
          throw Error();
      } catch {
        return json({ error: "Cursor inválido." }, { status: 400 });
      }
    }
    const query = database.prepare(
      `SELECT id, name, payload, created_at AS createdAt, updated_at AS updatedAt
       FROM characters WHERE owner_email = ? ${after ? "AND (updated_at < ? OR (updated_at = ? AND id < ?))" : ""}
       ORDER BY updated_at DESC, id DESC LIMIT 51`,
    );
    const { results } = await query
      .bind(user.email, ...(after ? [after.time, after.time, after.id] : []))
      .all<CharacterRow>();
    const page = results.slice(0, 50);
    const characters = page.map((row: CharacterRow) => {
      try {
        const payload = characterPayloadSchema.parse(JSON.parse(row.payload));
        return {
          ...row,
          payload: { name: payload.name, portraitImage: payload.portraitImage },
          invalid: false,
        };
      } catch {
        return {
          ...row,
          payload: { name: row.name, portraitImage: "" },
          invalid: true,
        };
      }
    });
    const last = page.at(-1);
    return json({
      characters,
      nextCursor:
        results.length > 50 && last
          ? btoa(JSON.stringify({ time: last.updatedAt, id: last.id }))
          : null,
    });
  } catch (error) {
    if (error instanceof RequestBodyError)
      return json({ error: error.message }, { status: error.status });
    console.error(
      "Falha ao processar fichas",
      error instanceof Error ? error.name : "unknown",
    );
    return json(
      { error: "Não foi possível processar a ficha. Tente novamente." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return unauthorized();

  try {
    const parsed = saveCharacterSchema.safeParse(
      await readJsonBody(request, 2_000_000),
    );
    if (!parsed.success) {
      return json(
        {
          error:
            parsed.error.issues.find(
              (issue) =>
                issue.path[0] === "payload" &&
                issue.path[1] === "divine" &&
                issue.code === "custom",
            )?.message ?? "A ficha contém dados inválidos.",
          issues: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    let normalized = normalizeCharacterPayload(parsed.data.payload);
    const vowErrors = getVowErrors(
      normalized,
      calculateAutomaticBonuses(normalized),
    );
    if (vowErrors.length) return json({ error: vowErrors[0] }, { status: 400 });
    let payload = JSON.stringify(normalized);
    if (new TextEncoder().encode(payload).byteLength > 1_900_000) {
      return json(
        {
          error:
            "A ficha excede o tamanho permitido. Reduza imagens e textos antes de salvar.",
        },
        { status: 413 },
      );
    }

    const database = await getD1();
    const previous = await database
      .prepare(
        "SELECT payload FROM characters WHERE id = ? AND owner_email = ?",
      )
      .bind(parsed.data.id, user.email)
      .first<{ payload: string }>();
    if (previous) {
      if (!parsed.data.baseRevision)
        return json(
          {
            error:
              "Reabra a ficha antes de salvar. A versão aberta não foi informada.",
            code: "REVISION_REQUIRED",
          },
          { status: 409 },
        );
      const old = normalizeCharacterPayload(
        characterPayloadSchema.parse(JSON.parse(previous.payload)),
      );
      if (parsed.data.baseRevision !== (await characterRevision(old)))
        return json(
          {
            error:
              "Esta ficha foi editada em outra aba. Seu rascunho foi preservado; exporte-o e reabra a versão atual antes de conciliar as alterações.",
            code: "REVISION_CONFLICT",
          },
          { status: 409 },
        );
      if (
        old.combatState?.inCombat ||
        old.combatState?.lastActionLog?.id !==
          normalized.combatState?.lastActionLog?.id
      ) {
        const log = old.combatState?.combatFeed ?? [];
        const knownId = normalized.combatState?.lastActionLog?.id;
        const knownIndex = log.findIndex((event) => event.id === knownId);
        const usedItemIds = new Set(
          log
            .slice(knownIndex + 1)
            .map((event) => event.inventoryItemId)
            .filter(Boolean),
        );
        normalized = mergeCombat(
          old,
          normalized,
          normalized.inventory.filter((item) => usedItemIds.has(item.id)),
        );
        payload = JSON.stringify(normalized);
      }
      const transitionError = validateVowTransition(old.vows, normalized.vows);
      if (transitionError)
        return json({ error: transitionError }, { status: 409 });
    }
    if (new TextEncoder().encode(payload).byteLength > 1_900_000)
      return json(
        { error: "A ficha excede o tamanho permitido." },
        { status: 413 },
      );
    const statement = database.prepare(
      `INSERT INTO characters (id, owner_email, name, payload, created_at, updated_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         payload = excluded.payload,
         updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
       WHERE characters.owner_email = excluded.owner_email AND characters.payload = ?`,
    );
    const result = await statement
      .bind(
        parsed.data.id,
        user.email,
        parsed.data.name,
        payload,
        previous?.payload ?? null,
      )
      .run();

    if (!result.success || result.meta.changes < 1) {
      return json(
        { error: "Não foi possível salvar esta ficha." },
        { status: 409 },
      );
    }

    const selected = await database
      .prepare(
        `SELECT id, name, payload, created_at AS createdAt, updated_at AS updatedAt
         FROM characters
         WHERE id = ? AND owner_email = ?
         LIMIT 1`,
      )
      .bind(parsed.data.id, user.email)
      .first<CharacterRow>();

    if (!selected) {
      return json(
        { error: "Ficha não encontrada após salvar." },
        { status: 500 },
      );
    }

    return json({
      character: {
        ...selected,
        payload: characterPayloadSchema.parse(JSON.parse(selected.payload)),
        revision: await characterRevision(
          normalizeCharacterPayload(
            characterPayloadSchema.parse(JSON.parse(selected.payload)),
          ),
        ),
      },
    });
  } catch (error) {
    if (error instanceof RequestBodyError)
      return json({ error: error.message }, { status: error.status });
    console.error(
      "Falha ao processar fichas",
      error instanceof Error ? error.name : "unknown",
    );
    return json(
      { error: "Não foi possível processar a ficha. Tente novamente." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return unauthorized();

  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!/^[a-zA-Z0-9-]{12,80}$/.test(id)) {
    return json({ error: "Identificador inválido." }, { status: 400 });
  }

  try {
    const database = await getD1();
    const result = await database
      .prepare("DELETE FROM characters WHERE id = ? AND owner_email = ?")
      .bind(id, user.email)
      .run();

    if (result.meta.changes < 1) {
      return json({ error: "Ficha não encontrada." }, { status: 404 });
    }
    return json({ deleted: true });
  } catch (error) {
    if (error instanceof RequestBodyError)
      return json({ error: error.message }, { status: error.status });
    console.error(
      "Falha ao processar fichas",
      error instanceof Error ? error.name : "unknown",
    );
    return json(
      { error: "Não foi possível processar a ficha. Tente novamente." },
      { status: 500 },
    );
  }
}
