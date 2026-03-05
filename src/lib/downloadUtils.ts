import { toast } from "react-hot-toast"
import { saveAs } from "file-saver"

export const downloadFile = (content: Blob | string, fileName: string, type: string) => {
  const blob = content instanceof Blob ? content : new Blob([content], { type: `${type};charset=utf-8;` })
  // FileSaver is more reliable than <a download> for async-generated files.
  saveAs(blob, fileName)
}

export const generateReport = async (
  format: string,
  fileName: string,
  headers: string[],
  data: (string | number)[][],
  title: string,
  metadata?: Record<string, any>
) => {
  try {
    const timestamp = new Date().toISOString().split('T')[0]
    const base = String(fileName || 'report')
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9._-]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 80)

    const hasDateSuffix = /_\d{4}-\d{2}-\d{2}$/.test(base)
    const fullFileName = hasDateSuffix ? base : `${base}_${timestamp}`

    switch (format) {
      case 'csv': {
        const csvContent = [
          headers.join(','),
          ...data.map(row => row.map(cell => {
            const cellStr = String(cell)
            // Escape quotes and wrap in quotes if it contains comma or quotes
            if (cellStr.includes(',') || cellStr.includes('"')) {
              return `"${cellStr.replace(/"/g, '""')}"`
            }
            return cellStr
          }).join(','))
        ].join('\n')
        downloadFile(csvContent, `${fullFileName}.csv`, 'text/csv')
        break
      }

      case 'excel': {
        const ExcelJS = await import('exceljs')
        const workbook = new ExcelJS.Workbook()
        workbook.creator = 'Calculator Loop'
        workbook.created = new Date()

        // Summary sheet
        if (metadata && Object.keys(metadata).length > 0) {
          const summarySheet = workbook.addWorksheet('Summary')
          summarySheet.columns = [
            { key: 'key', width: 30 },
            { key: 'value', width: 40 },
          ]
          summarySheet.addRow(['Parameter', 'Value'])
          const summaryHeader = summarySheet.getRow(1)
          summaryHeader.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 }
          summaryHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2980B9' } }
          summaryHeader.alignment = { horizontal: 'center' }
          summaryHeader.height = 22
          Object.entries(metadata).forEach(([k, v], i) => {
            const row = summarySheet.addRow([k, String(v)])
            if (i % 2 === 0) {
              row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4F8' } }
            }
            row.getCell(2).font = { bold: true }
          })
        }

        // Data sheet
        const worksheet = workbook.addWorksheet('Data')
        worksheet.columns = headers.map((h) => ({
          header: h,
          key: h,
          width: Math.max(h.length + 4, 14),
        }))

        // Style header row
        const headerRow = worksheet.getRow(1)
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A56DB' } }
        headerRow.alignment = { horizontal: 'center', vertical: 'middle' }
        headerRow.height = 24

        data.forEach((row, i) => {
          const addedRow = worksheet.addRow(row)
          if (i % 2 === 0) {
            addedRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F8FF' } }
          }
          addedRow.eachCell((cell) => {
            cell.border = {
              bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            }
          })
        })

        // Auto-fit columns based on content
        worksheet.columns.forEach((col) => {
          let maxLength = (col.header as string)?.length ?? 10
          col.eachCell?.({ includeEmpty: false }, (cell) => {
            const len = String(cell.value ?? '').length
            if (len > maxLength) maxLength = len
          })
          col.width = Math.min(maxLength + 2, 50)
        })

        const buffer = await workbook.xlsx.writeBuffer()
        const mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        const blob = new Blob([buffer as ArrayBuffer], { type: mime })
        downloadFile(blob, `${fullFileName}.xlsx`, mime)
        break
      }

      case 'pdf':
      case 'pdf-encrypted': {
        const jsPDF = (await import('jspdf')).default
        const autoTable = (await import('jspdf-autotable')).default

        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
        const pageW = doc.internal.pageSize.getWidth()
        const pageH = doc.internal.pageSize.getHeight()
        const safe = (s: any) => String(s ?? '').replace(/\u20B9/g, 'Rs.').replace(/[\u0900-\u097F]+/g, '').trim()

        // --- Header banner ---
        doc.setFillColor(26, 86, 219)
        doc.rect(0, 0, pageW, 26, 'F')
        doc.setFontSize(17)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(255, 255, 255)
        doc.text(safe(title), 14, 12)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.text(`Generated: ${new Date().toLocaleString()}  |  Calculator Loop`, 14, 20)
        if (format === 'pdf-encrypted') {
          doc.setTextColor(255, 220, 0)
          doc.setFontSize(8)
          doc.setFont('helvetica', 'bold')
          doc.text('CONFIDENTIAL', pageW - 14, 12, { align: 'right' })
        }
        doc.setTextColor(0, 0, 0)

        let startY = 34

        // --- Metadata / Input Summary ---
        if (metadata && Object.keys(metadata).length > 0) {
          doc.setFontSize(11)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(26, 86, 219)
          doc.text('Input Summary', 14, startY)
          startY += 4
          doc.setDrawColor(26, 86, 219)
          doc.setLineWidth(0.4)
          doc.line(14, startY, pageW - 14, startY)
          startY += 5

          const metaEntries = Object.entries(metadata)
          const colW = (pageW - 28) / 2
          doc.setFontSize(9)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(60, 60, 60)
          metaEntries.forEach(([k, v], i) => {
            const col = i % 2
            const row = Math.floor(i / 2)
            const x = 14 + col * colW
            const y = startY + row * 7
            if (col === 0 && i % 2 === 0 && row % 2 === 0) {
              doc.setFillColor(240, 244, 255)
              doc.rect(14, y - 4, pageW - 28, 7, 'F')
            }
            doc.setFont('helvetica', 'bold')
            doc.text(`${safe(k)}:`, x + 1, y)
            doc.setFont('helvetica', 'normal')
            doc.text(safe(v), x + colW * 0.45, y)
          })
          startY += Math.ceil(metaEntries.length / 2) * 7 + 6
        }

        // --- Data table ---
        if (data.length > 0) {
          doc.setFontSize(11)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(26, 86, 219)
          doc.text('Data', 14, startY)
          startY += 4
          doc.setDrawColor(26, 86, 219)
          doc.setLineWidth(0.4)
          doc.line(14, startY, pageW - 14, startY)
          startY += 3

          const safeData = data.map(row => row.map(cell => safe(cell)))
          const safeHeaders = headers.map(h => safe(h))

          autoTable(doc, {
            head: [safeHeaders],
            body: safeData,
            startY: startY,
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 2.5, textColor: [40, 40, 40], lineColor: [220, 220, 220], lineWidth: 0.2 },
            headStyles: { fillColor: [26, 86, 219], textColor: 255, fontStyle: 'bold', fontSize: 9, cellPadding: 3 },
            alternateRowStyles: { fillColor: [245, 248, 255] },
            columnStyles: {},
            margin: { left: 14, right: 14 },
            didDrawPage: (d: any) => {
              // Footer on every page
              const pg = (doc as any).internal.getCurrentPageInfo().pageNumber
              const total = (doc as any).internal.getNumberOfPages()
              doc.setFontSize(7)
              doc.setTextColor(150, 150, 150)
              doc.setFont('helvetica', 'normal')
              doc.text('Calculator Loop — calculatorloop.com', 14, pageH - 6)
              doc.text(`Page ${pg} of ${total}`, pageW - 14, pageH - 6, { align: 'right' })
            },
          } as any)
        }

        if (format === 'pdf-encrypted') {
          // Diagonal watermark on each page
          const totalPgs = (doc as any).internal.getNumberOfPages()
          for (let p = 1; p <= totalPgs; p++) {
            doc.setPage(p)
            doc.setFontSize(50)
            doc.setTextColor(230, 230, 230)
            doc.setFont('helvetica', 'bold')
            doc.text('CONFIDENTIAL', pageW / 2, pageH / 2, { align: 'center', angle: 45 })
          }
          doc.save(`${fullFileName}_secure.pdf`)
        } else {
          doc.save(`${fullFileName}.pdf`)
        }
        break
      }

      case 'json': {
        const jsonContent = JSON.stringify({ title, metadata, data }, null, 2)
        downloadFile(jsonContent, `${fullFileName}.json`, 'application/json')
        break
      }

      case 'html': {
        const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} | Calculator Loop</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #f0f4ff; color: #1e293b; min-height: 100vh; }
    .header { background: linear-gradient(135deg, #1a56db 0%, #7c3aed 100%); color: white; padding: 28px 32px; }
    .header h1 { font-size: 1.75rem; font-weight: 700; letter-spacing: -0.025em; }
    .header .subtitle { font-size: 0.85rem; opacity: 0.8; margin-top: 4px; }
    .container { max-width: 960px; margin: 32px auto; padding: 0 16px; }
    .card { background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06); margin-bottom: 24px; overflow: hidden; }
    .card-title { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #1a56db; padding: 14px 20px 10px; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 8px; }
    .card-title::before { content: ''; display: inline-block; width: 3px; height: 14px; background: #1a56db; border-radius: 2px; }
    .meta-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0; padding: 0; }
    .meta-item { padding: 12px 20px; border-bottom: 1px solid #f1f5f9; display: flex; flex-direction: column; gap: 2px; }
    .meta-item:nth-child(odd) { background: #f8faff; }
    .meta-key { font-size: 0.72rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
    .meta-val { font-size: 0.92rem; font-weight: 700; color: #1e293b; }
    table { width: 100%; border-collapse: collapse; font-size: 0.855rem; }
    thead tr { background: #1a56db; color: white; }
    thead th { padding: 11px 14px; text-align: left; font-weight: 600; font-size: 0.8rem; letter-spacing: 0.03em; white-space: nowrap; }
    tbody tr:nth-child(even) { background: #f5f8ff; }
    tbody td { padding: 9px 14px; border-bottom: 1px solid #e5e7eb; color: #374151; }
    tbody tr:hover td { background: #eef2ff; }
    .footer { text-align: center; padding: 24px; font-size: 0.78rem; color: #94a3b8; }
    @media print { body { background: white; } .card { box-shadow: none; border: 1px solid #e5e7eb; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>${title}</h1>
    <div class="subtitle">Generated on ${new Date().toLocaleString()} &nbsp;|&nbsp; Calculator Loop</div>
  </div>
  <div class="container">
    ${metadata && Object.keys(metadata).length > 0 ? `
    <div class="card">
      <div class="card-title">Input Summary</div>
      <div class="meta-grid">
        ${Object.entries(metadata).map(([k, v]) => `<div class="meta-item"><span class="meta-key">${k}</span><span class="meta-val">${v}</span></div>`).join('')}
      </div>
    </div>` : ''}
    ${data.length > 0 ? `
    <div class="card">
      <div class="card-title">Report Data</div>
      <div style="overflow-x:auto">
        <table>
          <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
          <tbody>${data.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>
      </div>
    </div>` : ''}
  </div>
  <div class="footer">Calculator Loop &mdash; calculatorloop.com</div>
</body>
</html>`
        downloadFile(htmlContent, `${fullFileName}.html`, 'text/html')
        break
      }

      case 'xml': {
        const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<report>
  <title>${title}</title>
  <metadata>
    ${metadata ? Object.entries(metadata).map(([k, v]) => `<item key="${k}">${v}</item>`).join('\n    ') : ''}
  </metadata>
  <data>
    ${data.map(row => `
    <row>
      ${row.map((cell, i) => `<${headers[i].replace(/[^a-zA-Z0-9]/g, '_')}>${cell}</${headers[i].replace(/[^a-zA-Z0-9]/g, '_')}>`).join('\n      ')}
    </row>`).join('')}
  </data>
</report>`
        downloadFile(xmlContent, `${fullFileName}.xml`, 'application/xml')
        break
      }

      case 'sql': {
        const tableName = title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
        const sqlContent = `
CREATE TABLE IF NOT EXISTS ${tableName} (
  ${headers.map(h => `${h.replace(/[^a-zA-Z0-9]/g, '_')} VARCHAR(255)`).join(',\n  ')}
);

INSERT INTO ${tableName} (${headers.map(h => h.replace(/[^a-zA-Z0-9]/g, '_')).join(', ')}) VALUES
${data.map(row => `(${row.map(cell => `'${String(cell).replace(/'/g, "''")}'`).join(', ')})`).join(',\n')};
        `
        downloadFile(sqlContent, `${fullFileName}.sql`, 'application/sql')
        break
      }

      case 'png':
      case 'jpg': {
        const element = document.getElementById('calculator-content')
        if (!element) throw new Error('Calculator content not found')
        
        const html2canvas = (await import('html2canvas')).default
        const canvas = await html2canvas(element, {
          backgroundColor: '#ffffff',
          scale: 2,
        })
        
        const link = document.createElement('a')
        link.download = `${fullFileName}.${format}`
        link.href = canvas.toDataURL(`image/${format === 'jpg' ? 'jpeg' : 'png'}`)
        link.click()
        break
      }

      case 'zip':
      case 'zip-encrypted': {
        const JSZip = (await import('jszip')).default
        const zip = new JSZip()
        
        const csvContent = [headers.join(','), ...data.map(row => row.join(','))].join('\n')
        zip.file(`${fullFileName}.csv`, csvContent)
        
        const jsonContent = JSON.stringify({ title, metadata, data }, null, 2)
        zip.file(`${fullFileName}.json`, jsonContent)
        
        if (format === 'zip-encrypted') {
             zip.file('README_SECURE.txt', `This archive was generated with security intent.\nNote: Client-side ZIP encryption is limited. Please password protect this file manually after download.`)
        } else {
             zip.file('README.txt', `Report: ${title}\nGenerated on: ${new Date().toLocaleString()}\n\nThis archive contains your financial calculator results in multiple formats.`)
        }

        const content = await zip.generateAsync({ type: "blob" })
        downloadFile(content, `${fullFileName}${format === 'zip-encrypted' ? '_secure' : ''}.zip`, 'application/zip')
        break
      }
      
      case 'docx': {
         const htmlContent = `
          <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
          <head><title>${title}</title></head>
          <body>
            <h1>${title}</h1>
            ${metadata ? Object.entries(metadata).map(([k, v]) => `<p><strong>${k}:</strong> ${v}</p>`).join('') : ''}
            <table border="1" style="border-collapse: collapse; width: 100%;">
              <thead>
                <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
              </thead>
              <tbody>
                ${data.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
              </tbody>
            </table>
          </body></html>
        `
        downloadFile(htmlContent, `${fullFileName}.doc`, 'application/msword')
        break
      }

      case 'pptx': {
        const pptxgen = (await import('pptxgenjs')).default
        const pres = new pptxgen()
        
        const slide = pres.addSlide()
        slide.addText(title, { x: 0.5, y: 0.5, fontSize: 24, bold: true, color: '363636' })
        
        if (metadata) {
            let yPos = 1.5
            Object.entries(metadata).forEach(([k, v]) => {
                slide.addText(`${k}: ${v}`, { x: 0.5, y: yPos, fontSize: 14, color: '666666' })
                yPos += 0.4
            })
        }

        const tableData = [
            headers,
            ...data
        ]
        
        slide.addTable(tableData as any[], { x: 0.5, y: 3.5, w: 9, colW: [2, 2, 2, 2] }) // Simple auto layout
        
        await pres.writeFile({ fileName: `${fullFileName}.pptx` })
        break
      }

      case 'ods': {
        toast.error('OpenOffice (.ods) export is not supported right now')
        return
      }

      case 'svg': {
        const element = document.getElementById('calculator-content')
        const svgElement = element?.querySelector('svg')
        
        if (svgElement) {
            const serializer = new XMLSerializer()
            const svgString = serializer.serializeToString(svgElement)
            downloadFile(svgString, `${fullFileName}.svg`, 'image/svg+xml')
        } else {
            toast.error('No chart found to export as SVG')
            return
        }
        break
      }

      case 'api': {
        const url = new URL(window.location.href)
        // Add dummy query params to simulate API link
        if (metadata) {
            Object.entries(metadata).forEach(([k, v]) => url.searchParams.set(k, String(v)))
        }
        await navigator.clipboard.writeText(url.toString())
        toast.success('API Link copied to clipboard!')
        return // Exit early as we don't download a file
      }

      case 'sqlite': {
        // SQLite compatible SQL dump
        const tableName = title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
        const sqlContent = `
BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS ${tableName} (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ${headers.map(h => `${h.replace(/[^a-zA-Z0-9]/g, '_')} TEXT`).join(',\n  ')}
);

${data.map(row => `INSERT INTO ${tableName} (${headers.map(h => h.replace(/[^a-zA-Z0-9]/g, '_')).join(', ')}) VALUES (${row.map(cell => `'${String(cell).replace(/'/g, "''")}'`).join(', ')});`).join('\n')}
COMMIT;
        `
        downloadFile(sqlContent, `${fullFileName}.sql`, 'application/sql')
        break
      }
    }
    toast.success(`Downloaded ${fileName} as ${format.toUpperCase()}`)
  } catch (error) {
    console.error('Download error:', error)
    toast.error('Failed to generate report')
  }
}
