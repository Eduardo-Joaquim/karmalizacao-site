import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getD1 } from "@/db";
import { characterPayloadSchema, saveCharacterSchema } from "@/lib/character-schema";
import { mergeCombat } from "@/lib/combat-engine";
import { normalizeCharacterPayload } from "@/lib/character-data";
import { calculateAutomaticBonuses, getVowErrors, validateVowTransition } from "@/lib/character-rules";

export const dynamic = "force-dynamic";

type CharacterRow = {
  id: string;
  name: string;
  payload: string;
  createdAt: string;
  updatedAt: string;
};

function unauthorized() {
  return Response.json({ error: "Autenticação necessária" }, { status: 401 });
}

export async function GET(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return unauthorized();

  try {
    const database = await getD1();
    const requestedId = new URL(request.url).searchParams.get("id");
    if (requestedId) {
      if (!/^[a-zA-Z0-9-]{12,80}$/.test(requestedId)) return Response.json({ error: "Identificador inválido." }, { status: 400 });
      const row = await database.prepare(
        `SELECT id, name, payload, created_at AS createdAt, updated_at AS updatedAt
         FROM characters WHERE id = ? AND owner_email = ? LIMIT 1`,
      ).bind(requestedId, user.email).first<CharacterRow>();
      if (!row) return Response.json({ error: "Ficha não encontrada." }, { status: 404 });
      const payload = normalizeCharacterPayload(characterPayloadSchema.parse(JSON.parse(row.payload)));
      return Response.json({ character: { ...row, payload } });
    }

    const query = database.prepare(
      `SELECT id, name, payload, created_at AS createdAt, updated_at AS updatedAt
       FROM characters
       WHERE owner_email = ?
       ORDER BY updated_at DESC, created_at DESC
       LIMIT 50`,
    );
    const { results } = await query.bind(user.email).all<CharacterRow>();
    const characters = results.flatMap((row: CharacterRow) => {
      try {
        const payload = normalizeCharacterPayload(characterPayloadSchema.parse(JSON.parse(row.payload)));
        // Portraits remain available for the sidebar; larger invocation art is fetched only when a sheet opens.
        const summaryPayload = { ...payload, invocations: payload.invocations.map((invocation) => ({ ...invocation, image: "" })) };
        return [{ ...row, payload: summaryPayload }];
      } catch {
        return [];
      }
    });

    return Response.json({ characters });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return unauthorized();

  try {
    const parsed = saveCharacterSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json(
        { error: "A ficha contém dados inválidos.", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    let normalized = normalizeCharacterPayload(parsed.data.payload);
    const vowErrors = getVowErrors(normalized, calculateAutomaticBonuses(normalized));
    if (vowErrors.length) return Response.json({ error: vowErrors[0] }, { status: 400 });
    let payload = JSON.stringify(normalized);
    if (new TextEncoder().encode(payload).byteLength > 1_900_000) {
      return Response.json({ error: "A ficha excede o tamanho permitido. Reduza imagens e textos antes de salvar." }, { status: 413 });
    }

    const database = await getD1();
    const previous = await database.prepare("SELECT payload FROM characters WHERE id = ? AND owner_email = ?")
      .bind(parsed.data.id, user.email).first<{ payload: string }>();
    if (previous) {
      const old = normalizeCharacterPayload(characterPayloadSchema.parse(JSON.parse(previous.payload)));
      if (old.combatState?.inCombat || old.combatState?.lastActionLog?.id !== normalized.combatState?.lastActionLog?.id) {
        normalized = mergeCombat(old, normalized);
        payload = JSON.stringify(normalized);
      }
      const transitionError = validateVowTransition(old.vows, normalized.vows);
      if (transitionError) return Response.json({ error: transitionError }, { status: 409 });
    }
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
      .bind(parsed.data.id, user.email, parsed.data.name, payload, previous?.payload ?? null)
      .run();

    if (!result.success || result.meta.changes < 1) {
      return Response.json({ error: "Não foi possível salvar esta ficha." }, { status: 409 });
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
      return Response.json({ error: "Ficha não encontrada após salvar." }, { status: 500 });
    }

    return Response.json({
      character: {
        ...selected,
        payload: characterPayloadSchema.parse(JSON.parse(selected.payload)),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return unauthorized();

  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!/^[a-zA-Z0-9-]{12,80}$/.test(id)) {
    return Response.json({ error: "Identificador inválido." }, { status: 400 });
  }

  try {
    const database = await getD1();
    const result = await database
      .prepare("DELETE FROM characters WHERE id = ? AND owner_email = ?")
      .bind(id, user.email)
      .run();

    if (result.meta.changes < 1) {
      return Response.json({ error: "Ficha não encontrada." }, { status: 404 });
    }
    return Response.json({ deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado";
    return Response.json({ error: message }, { status: 500 });
  }
}
