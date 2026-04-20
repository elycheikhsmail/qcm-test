const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, VerticalAlign
} = require('docx');
const fs = require('fs');

const TABLE_WIDTH = 9026;
const C1 = 2256, C2 = 2256, C3 = 2256, C4 = 2258; // sum = 9026

const border = { style: BorderStyle.SINGLE, size: 8, color: "000000" };
const borders = { top: border, bottom: border, left: border, right: border };

function arabicPara(text, opts = {}) {
  return new Paragraph({
    bidirectional: true,
    alignment: opts.align || AlignmentType.CENTER,
    spacing: opts.spacing || {},
    children: [new TextRun({
      text,
      font: "Times New Roman",
      size: opts.size || 22,
      bold: opts.bold || false,
      rightToLeft: true,
    })]
  });
}

function makeCell(text, width, opts = {}) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: opts.fill ? { fill: opts.fill, type: ShadingType.CLEAR } : {},
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    verticalAlign: VerticalAlign.CENTER,
    children: [arabicPara(text, { bold: opts.bold, size: 22 })]
  });
}

function spanRow(text, fill) {
  return new TableRow({
    children: [new TableCell({
      borders,
      columnSpan: 4,
      width: { size: TABLE_WIDTH, type: WidthType.DXA },
      shading: fill ? { fill, type: ShadingType.CLEAR } : {},
      margins: { top: 100, bottom: 100, left: 140, right: 140 },
      children: [arabicPara(text, { bold: true })]
    })]
  });
}

function makeTable(competition, dateStr) {
  return new Table({
    width: { size: TABLE_WIDTH, type: WidthType.DXA },
    columnWidths: [C1, C2, C3, C4],
    visuallyRightToLeft: true,
    rows: [
      spanRow("الفترة الصباحية يوم الأحد", "BDD7EE"),
      new TableRow({
        children: [
          makeCell("المكان", C1, { fill: "D9E1F2", bold: true }),
          makeCell("المسابقة", C2, { fill: "D9E1F2", bold: true }),
          makeCell("التوقيت", C3, { fill: "D9E1F2", bold: true }),
          makeCell("التاريخ", C4, { fill: "D9E1F2", bold: true }),
        ]
      }),
      new TableRow({
        children: [
          makeCell("ثانوية أكجوجت", C1),
          makeCell(competition, C2),
          makeCell("8H - 12H", C3),
          makeCell(dateStr, C4),
        ]
      }),
      spanRow("الفترة المسائية  طيلة أيام الأسبوع  من الاثنين الى الاحد", ""),
      new TableRow({
        children: [
          makeCell("ثانوية أكجوجت", C1),
          makeCell(competition, C2),
          makeCell("16H - 19H", C3),
          makeCell(dateStr, C4),
        ]
      }),
    ]
  });
}

function titlePara(text) {
  return new Paragraph({
    bidirectional: true,
    alignment: AlignmentType.CENTER,
    spacing: { before: 300, after: 300 },
    children: [new TextRun({
      text,
      font: "Times New Roman",
      size: 28,
      bold: true,
      rightToLeft: true,
    })]
  });
}

const doc = new Document({
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    children: [
      titlePara("جدول امتحان الرياضة البدنية بالنسبة لمركز ثانوية أكجوجت  BAC 2026"),
      makeTable("BAC", "15 au 30 Avril 2026"),
      new Paragraph({ spacing: { before: 400, after: 400 }, children: [new TextRun("")] }),
      titlePara("جدول الرياضة البدنية بالنسبة لمركز ثانوية أكجوجت  BEPC 2026"),
      makeTable("BEPC", "22 au 30 Avril 2026"),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("جدول_الامتحان.docx", buffer);
  console.log("Créé: جدول_الامتحان.docx");
});
