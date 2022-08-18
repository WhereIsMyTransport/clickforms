
const CSV_URL_DEFAULT = getCSVURL('1S2NRaMlS-RFkG3RJtQ8iE0nRwqjMQJGpzESbcZcaV0U', 0);
const AUTO_SUBMIT = false;

function b(t, n, i = e => e) { let e = Object.create(null); e.options = n || {}, e.reviver = i, e.value = "", e.entry = [], e.output = [], e.col = 1, e.row = 1; let l = /"|,|\r\n|\n|\r|[^",\r\n]+/y, a = /^(\r\n|\n|\r)$/, u = [], o = "", r = 0; for (; (u = l.exec(t)) !== null;)switch (o = u[0], r) { case 0: switch (!0) { case o === '"': r = 3; break; case o === ",": r = 0, s(e); break; case a.test(o): r = 0, s(e), c(e); break; default: e.value += o, r = 2; break }break; case 2: switch (!0) { case o === ",": r = 0, s(e); break; case a.test(o): r = 0, s(e), c(e); break; default: throw r = 4, Error(`CSVError: Illegal state [row:${e.row}, col:${e.col}]`) }break; case 3: switch (!0) { case o === '"': r = 4; break; default: r = 3, e.value += o; break }break; case 4: switch (!0) { case o === '"': r = 3, e.value += o; break; case o === ",": r = 0, s(e); break; case a.test(o): r = 0, s(e), c(e); break; default: throw Error(`CSVError: Illegal state [row:${e.row}, col:${e.col}]`) }break }return e.entry.length !== 0 && (s(e), c(e)), e.output } function w(t, n = {}, i = e => e) {
  let e = Object.create(null); e.options = n, e.options.eof = e.options.eof !== void 0 ? e.options.eof : !0, e.row = 1, e.col = 1, e.output = ""; let l = /"|,|\r\n|\n|\r/; return t.forEach((a, u) => {
    let o = ""; switch (e.col = 1, a.forEach((r, f) => { typeof r == "string" && (r = r.replace(/"/g, '""'), r = l.test(r) ? `"${r}"` : r), o += i(r, e.row, e.col), f !== a.length - 1 && (o += ","), e.col++ }), !0) {
      case e.options.eof: case (!e.options.eof && u !== t.length - 1): e.output += `${o}
`; break; default: e.output += `${o}`; break
    }e.row++
  }), e.output
} function s(t) { let n = t.options.typed ? p(t.value) : t.value; t.entry.push(t.reviver(n, t.row, t.col)), t.value = "", t.col++ } function c(t) { t.output.push(t.entry), t.entry = [], t.row++, t.col = 1 } function p(t) { let n = /.\./; switch (!0) { case t === "true": case t === "false": return t === "true"; case n.test(t): return parseFloat(t); case isFinite(t): return parseInt(t); default: return t } }

const parseCSV = (csv) => {
  /*
  converts csv text data into a JSON object
  */
  const dataMatrix = b(csv);
  const cols = dataMatrix[0];
  const data = [];
  dataMatrix.map((row, index) => {
    if (index > 0) {
      let dict = {}
      row.map((value, j) => {
        dict[cols[j]] = value.trim()
      })
      data.push(dict)
    }
  })
  return data
};

function getCSVURL(id = './src/sample_clickup.csv', gid = 0) {
  /*
  id: can be a csv local file or google spreadsheet url which must be open as public URL
  @gid is only required for google spreadsheet
  */
  if (id.endsWith('.csv')) {
    return chrome.runtime.getURL(id);
  } else {
    return `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&tq&gid=${gid}`
  }
}

const langLib = {
  "en": {
    "title": "Clickup Forms Auto Filler",
    "label": "Label",
    "value": "Value",
    "saved": "Saved",
    "add": "Next Input",
    "save": "Fill Clickup Form",
    "previous": "Previous Input"
  },
  "tr": {
    "title": "ClickUp Forms Doldurucu",
    "label": "Başlık",
    "value": "Cevap",
    "saved": "Kaydedildi",
    "add": "Ekle",
    "save": "Kaydet"
  }
}

const questions = [
  "City*",
  "Agency*",
  "Source*",

  "Update Type (select multiple options if applicable)*",
  "Bulk Update?",
  "Collection",
  "Partnerdash feed",

  "Old Version",
  "New Version",

  "Effect Date*",
  "Temporary Change?",
  "Expiry Date",
  "Priority*",

  "Hub / Station Name",
  "Route New (Collection)",
  "Route ID",
  "Route Name (Current)",
  "Operator Name (Current)",
  "Route Number (Current)",
  "Vehicle Type(s) (Current)",
  "Fare (Current)",
  "Stop ID",
  "Stop Name",
  "Stop Relocation Details (Link, W3W, Coordinates etc.)",
  "Updated Route name",
  "Updated Operator Name",
  "Updated Route Number",
  "Updated  Vehicle Type(s)",
  "Updated Fare",
  "Weekday Start Time",
  "Weekday Finish Time",
  "Weekend Start Time",
  "Weekend Finish Time",
  "Weekday Frequency - Morning Peak",
  "Weekday Frequency - Off Peak",
  "Weekday Frequency - Evening Peak",
  "Weekend Frequencies - Morning Peak",
  "Weekend Frequencies - Off Peak",
  "Weekend Frequencies - Evening Peak",
  "Schedules / Timetables (Departure Based)",
  "Other (Any other type of update or additional Info)",
  "Link - Primary",
  "Link - Secondary",
  "Attachment"
]

const DEBUG = false
const UPDATE_TYPES_LABEL = "Update Type (select multiple options if applicable)*";
const alwaysVisibleFields = [
  "Ticket Name",
  "City*",
  "Agency*",
  "Update Type (select multiple options if applicable)*",
  "Bulk Update?",
  "Collection",
  "Partnerdash feed",
  "Old Version",
  "New Version",
  "Source*",
  "Effect Date*",
  "Temporary Change?",
  "Expiry Date",
  "Priority*",
  "Route ID",
  "Route Name (Current)",
  "Other (Any other type of update or additional Info)",
  "Link - Primary",
  "Link - Secondary",
  "Attachment"
]

//Add conditional visibility to the clickup form
const conditionalFields = {
  // [this field is visible]: [if chosen any of these update types]
  "Hub / Station Name": ['Other', 'Stops - Relocation', 'Station / Hub - Any', 'Stops - Other'],
  "Route New (Collection)": [
    'Route - New',
    'Route - Remove',
    'Route - Operator',
    'Route - Route Nr',
    'Route - Shape',
    'Fares - Any',

    'Operating Hours',
    'Service Exceptions',
    'Frequencies', 'Timetables', 'Operating Days',

    'Photos', 'Other'
  ],
  "Operator Name (Current)": ['Other'],
  "Route Number (Current)": [
    'Stops - Relocation', 'Station / Hub - Any', 'Stops - Other',
    'Route - New', 'Route - Remove', 'Route - Name',
    'Route - Operator',
    'Route - Route Nr',
    'Route - Shape',
    'Fares - Any',

    'Operating Hours',
    'Service Exceptions',
    'Frequencies', 'Timetables', 'Operating Days',

    'Photos', 'Other'],
  "Vehicle Type(s) (Current)": ['Other'],
  "Fare (Current)": ['Other', 'Fares - Any'],
  "Stop ID": ['Stops - Relocation', 'Station / Hub - Any', 'Stops - Other',],
  "Stop Name": ['Stops - Relocation', 'Station / Hub - Any', 'Stops - Other'],
  "Stop Relocation Details (Link, W3W, Coordinates etc.)": ['Other', 'Stops - Relocation'],
  "Updated Route name": ['Other', 'Route - New', 'Route - Remove', 'Route - Name',],
  "Updated Operator Name": ['Other', 'Route - Operator',],
  "Updated Route Number": ['Other', 'Route - Route Nr',],
  "Updated  Vehicle Type(s)": ['Other'],
  "Updated Fare": ['Other', 'Fares - Any'],

  "Weekday Start Time": ['Other', 'Operating Hours',
    'Service Exceptions',
    'Frequencies', 'Timetables', 'Operating Days'
  ],
  "Weekday Finish Time": ['Other', 'Operating Hours',
    'Service Exceptions',
    'Frequencies', 'Timetables', 'Operating Days'
  ],
  "Weekend Start Time": ['Other', 'Operating Hours',
    'Service Exceptions',
    'Frequencies', 'Timetables', 'Operating Days'
  ],
  "Weekend Finish Time": ['Other', 'Operating Hours',
    'Service Exceptions',
    'Frequencies', 'Timetables', 'Operating Days'
  ],
  "Weekday Frequency - Morning Peak": ['Other', 'Operating Hours',
    'Service Exceptions',
    'Frequencies', 'Timetables', 'Operating Days'
  ],
  "Weekday Frequency - Off Peak": ['Other', 'Operating Hours',
    'Service Exceptions',
    'Frequencies', 'Timetables', 'Operating Days'
  ],
  "Weekday Frequency - Evening Peak": ['Other', 'Operating Hours',
    'Service Exceptions',
    'Frequencies', 'Timetables', 'Operating Days'
  ],
  "Weekend Frequencies - Morning Peak": ['Other', 'Operating Hours',
    'Service Exceptions',
    'Frequencies', 'Timetables', 'Operating Days'
  ],
  "Weekend Frequencies - Off Peak": ['Other', 'Operating Hours',
    'Service Exceptions',
    'Frequencies', 'Timetables', 'Operating Days'
  ],
  "Weekend Frequencies - Evening Peak": ['Other', 'Operating Hours',
    'Service Exceptions',
    'Frequencies', 'Timetables', 'Operating Days'
  ],
  "Schedules / Timetables (Departure Based)": ['Other', 'Operating Hours',
    'Service Exceptions',
    'Frequencies', 'Timetables', 'Operating Days'
  ],
}