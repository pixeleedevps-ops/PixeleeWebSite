const TARGET_COLUMNS = {
  campaign_name: 8, // H
  platform: 12, // L
  tipo_de_negocio: 13, // M
  nombre_y_apellidos: 15, // O
  numero_de_telefono: 16, // P
  lead_status: 17, // Q
  comentarios: 24, // X
};

function doPost(e) {
  try {
    const payload = parsePayload_(e);
    const sheet = getTargetSheet_();
    const nextRow = Math.max(sheet.getLastRow() + 1, 2);
    const row = new Array(TARGET_COLUMNS.comentarios).fill("");

    row[TARGET_COLUMNS.campaign_name - 1] = getCampaignName_();
    row[TARGET_COLUMNS.platform - 1] = "Formulario landing";
    row[TARGET_COLUMNS.tipo_de_negocio - 1] = pick_(payload, [
      "tipo_de_negocio",
      "A que se dedica",
      "a_que_se_dedica",
    ]);
    row[TARGET_COLUMNS.nombre_y_apellidos - 1] = pick_(payload, [
      "nombre_y_apellidos",
      "Nombre completo",
      "nombre_completo",
    ]);
    row[TARGET_COLUMNS.numero_de_telefono - 1] = pick_(payload, [
      "número_de_teléfono",
      "numero_de_telefono",
      "Numero de WhatsApp",
      "whatsapp",
    ]);
    row[TARGET_COLUMNS.lead_status - 1] = "CREATED";
    row[TARGET_COLUMNS.comentarios - 1] = buildComentarios_(payload);

    sheet.getRange(nextRow, 1, 1, row.length).setValues([row]);

    return jsonResponse_({
      ok: true,
      row: nextRow,
    });
  } catch (error) {
    return jsonResponse_({
      ok: false,
      error: error.message,
    });
  }
}

function doGet() {
  return jsonResponse_({
    ok: true,
    message: "Pixelee leads webhook active",
  });
}

function parsePayload_(e) {
  if (!e) return {};

  const rawBody = e.postData && e.postData.contents ? e.postData.contents : "";
  if (rawBody) {
    try {
      return JSON.parse(rawBody);
    } catch (error) {
      return parseQueryString_(rawBody);
    }
  }

  return e.parameter || {};
}

function parseQueryString_(value) {
  return value.split("&").reduce(function (data, pair) {
    const parts = pair.split("=");
    if (!parts[0]) return data;
    const key = decodeURIComponent(parts[0].replace(/\+/g, " "));
    const fieldValue = decodeURIComponent((parts[1] || "").replace(/\+/g, " "));
    data[key] = fieldValue;
    return data;
  }, {});
}

function getTargetSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const configuredName = PropertiesService.getScriptProperties().getProperty("SHEET_NAME");
  const sheet = configuredName ? spreadsheet.getSheetByName(configuredName) : spreadsheet.getActiveSheet();

  if (!sheet) {
    throw new Error("No se encontro la hoja destino. Configura SHEET_NAME en Script Properties.");
  }

  return sheet;
}

function buildComentarios_(payload) {
  const presupuesto = pick_(payload, ["presupuesto", "Presupuesto"]);
  const acepto = pick_(payload, ["privacidad", "Acepto politicas", "acepto_politicas"]);
  const politicas = acepto === true || acepto === "true" || acepto === "on" || acepto === "1"
    ? "El cliente acepto las politicas"
    : "El cliente no acepto las politicas";
  const comentarios = [
    presupuesto ? "Presupuesto: " + presupuesto : "",
    politicas,
  ].filter(Boolean).join(". ");

  return comentarios || pick_(payload, ["Comentarios", "comentarios"]);
}

function getCampaignName_() {
  const monthNames = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];
  const timeZone = Session.getScriptTimeZone() || "America/Bogota";
  const monthIndex = Number(Utilities.formatDate(new Date(), timeZone, "M")) - 1;

  return "pixelee_trafico-leads_mes_" + monthNames[monthIndex];
}

function pick_(data, keys) {
  for (var i = 0; i < keys.length; i += 1) {
    const value = data[keys[i]];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }

  return "";
}

function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
