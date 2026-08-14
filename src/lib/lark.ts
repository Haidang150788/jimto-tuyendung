const LARK_API_BASE = "https://open.larksuite.com/open-apis";

interface CachedToken {
  token: string;
  expiresAt: number;
}

interface FieldInfo {
  name: string;
  type: number;
}

/** Lark field type code for Date/DateTime columns. */
const DATE_FIELD_TYPE = 5;

let cachedToken: CachedToken | null = null;
let cachedTableId: string | null = null;
let cachedFields: FieldInfo[] | null = null;

async function getTenantAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const res = await fetch(`${LARK_API_BASE}/auth/v3/tenant_access_token/internal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app_id: process.env.LARK_APP_ID,
      app_secret: process.env.LARK_APP_SECRET,
    }),
  });
  const data = (await res.json()) as {
    code: number;
    msg: string;
    tenant_access_token?: string;
    expire?: number;
  };

  if (data.code !== 0 || !data.tenant_access_token) {
    throw new Error(`Lark auth failed: ${data.msg} (code ${data.code})`);
  }

  cachedToken = {
    token: data.tenant_access_token,
    // Refresh a couple of minutes early to be safe.
    expiresAt: Date.now() + (data.expire ?? 7200) * 1000 - 2 * 60 * 1000,
  };
  return cachedToken.token;
}

async function findTableId(token: string): Promise<string> {
  if (cachedTableId) return cachedTableId;

  const appToken = process.env.LARK_BASE_APP_TOKEN;
  const tableName = process.env.LARK_TABLE_NAME;
  const res = await fetch(
    `${LARK_API_BASE}/bitable/v1/apps/${appToken}/tables?page_size=100`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const data = (await res.json()) as {
    code: number;
    msg: string;
    data?: { items?: { table_id: string; name: string }[] };
  };

  if (data.code !== 0) {
    throw new Error(`Lark list tables failed: ${data.msg} (code ${data.code})`);
  }

  const match = data.data?.items?.find((t) => t.name === tableName);
  if (!match) {
    const names = data.data?.items?.map((t) => t.name).join(", ") ?? "(không có bảng nào)";
    throw new Error(`Không tìm thấy bảng "${tableName}" trong Base. Các bảng hiện có: ${names}`);
  }

  cachedTableId = match.table_id;
  return match.table_id;
}

/** Normalizes a field name for case/whitespace-insensitive matching. */
function normalize(name: string): string {
  return name.trim().toLowerCase();
}

async function getFields(token: string, tableId: string): Promise<FieldInfo[]> {
  if (cachedFields) return cachedFields;

  const appToken = process.env.LARK_BASE_APP_TOKEN;
  const res = await fetch(
    `${LARK_API_BASE}/bitable/v1/apps/${appToken}/tables/${tableId}/fields?page_size=100`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const data = (await res.json()) as {
    code: number;
    data?: { items?: { field_name: string; type: number }[] };
  };

  cachedFields = (data.data?.items ?? []).map((f) => ({ name: f.field_name, type: f.type }));
  return cachedFields;
}

function resolveFieldName(fields: FieldInfo[], expectedName: string): string {
  const match = fields.find((f) => normalize(f.name) === normalize(expectedName));
  if (!match) {
    throw new Error(
      `Không tìm thấy cột "${expectedName}" trong bảng. Các cột hiện có: ` +
        fields.map((f) => f.name).join(", "),
    );
  }
  return match.name;
}

export interface ApplicationSubmission {
  name: string;
  phone: string;
  email: string;
  position: string;
}

export async function submitApplicationToLark(submission: ApplicationSubmission) {
  const token = await getTenantAccessToken();
  const tableId = await findTableId(token);
  const fields = await getFields(token, tableId);
  const appToken = process.env.LARK_BASE_APP_TOKEN;

  const dateField = fields.find(
    (f) => normalize(f.name) === "ngày" || f.type === DATE_FIELD_TYPE,
  );

  const record: Record<string, string | number> = {
    [resolveFieldName(fields, "họ tên")]: submission.name,
    [resolveFieldName(fields, "số điện thoại")]: submission.phone,
    [resolveFieldName(fields, "email")]: submission.email,
    [resolveFieldName(fields, "vị trí")]: submission.position,
  };
  if (dateField) {
    record[dateField.name] =
      dateField.type === DATE_FIELD_TYPE ? Date.now() : new Date().toLocaleDateString("vi-VN");
  }

  const res = await fetch(
    `${LARK_API_BASE}/bitable/v1/apps/${appToken}/tables/${tableId}/records`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields: record }),
    },
  );
  const data = (await res.json()) as { code: number; msg: string };

  if (data.code !== 0) {
    throw new Error(`Lark create record failed: ${data.msg} (code ${data.code})`);
  }
}
