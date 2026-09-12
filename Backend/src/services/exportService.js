const PDFDocument = require('pdfkit')

function generateMailPdf(mails, res) {
  const doc = new PDFDocument({ margin: 40 })

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', 'attachment; filename="envoy-export.pdf"')

  doc.pipe(res)

  doc.fontSize(18).text('Envoy — Exported Emails', { underline: true })
  doc.moveDown()

  mails.forEach((mail, i) => {
    doc.fontSize(12).fillColor('#000').text(`${i + 1}. ${mail.subject || '(No Subject)'}`, { bold: true })
    doc.fontSize(9).fillColor('#555').text(`From: ${mail.from || 'Unknown'}`)
    doc.fontSize(9).fillColor('#555').text(`Date: ${mail.date || 'Unknown'}`)
    doc.moveDown(0.3)
    doc.fontSize(10).fillColor('#222').text(mail.summary || mail.snippet || '')
    doc.moveDown()
    if (i < mails.length - 1) {
      doc.moveTo(doc.x, doc.y).lineTo(555, doc.y).strokeColor('#ddd').stroke()
      doc.moveDown()
    }
  })

  doc.end()
}

module.exports = { generateMailPdf }