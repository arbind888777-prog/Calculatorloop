       import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { toast } from 'react-hot-toast'

export interface ExportOptions {
  filename?: string
  format: 'png' | 'pdf' | 'svg'
  quality?: number
  includeBackground?: boolean
}

/**
 * Export a chart or component to PNG
 */
export async function exportToPNG(
  elementId: string,
  filename: string = 'chart.png',
  options: { quality?: number; includeBackground?: boolean } = {}
): Promise<void> {
  try {
    const element = document.getElementById(elementId)
    if (!element) {
      toast.error('Chart element not found')
      return
    }

    const canvas = await html2canvas(element, {
      backgroundColor: options.includeBackground ? '#ffffff' : null,
      scale: options.quality || 2,
      logging: false,
      useCORS: true
    })

    const link = document.createElement('a')
    link.download = filename
    link.href = canvas.toDataURL('image/png')
    link.click()

    toast.success('Chart exported as PNG')
  } catch (error) {
    console.error('PNG export failed:', error)
    toast.error('Export failed')
  }
}

/**
 * Export a chart or component to PDF
 */
export async function exportToPDF(
  elementId: string,
  filename: string = 'chart.pdf',
  options: {
    orientation?: 'portrait' | 'landscape'
    quality?: number
    includeBackground?: boolean
  } = {}
): Promise<void> {
  try {
    const element = document.getElementById(elementId)
    if (!element) {
      toast.error('Chart element not found')
      return
    }

    const canvas = await html2canvas(element, {
      backgroundColor: options.includeBackground ? '#ffffff' : null,
      scale: options.quality || 2,
      logging: false,
      useCORS: true
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: options.orientation || 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = canvas.width
    const imgHeight = canvas.height
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
    const imgX = (pdfWidth - imgWidth * ratio) / 2
    const imgY = 10

    pdf.addImage(
      imgData,
      'PNG',
      imgX,
      imgY,
      imgWidth * ratio,
      imgHeight * ratio
    )

    pdf.save(filename)
    toast.success('Chart exported as PDF')
  } catch (error) {
    console.error('PDF export failed:', error)
    toast.error('Export failed')
  }
}

/**
 * Export SVG chart
 */
export async function exportToSVG(
  elementId: string,
  filename: string = 'chart.svg'
): Promise<void> {
  try {
    const element = document.getElementById(elementId)
    if (!element) {
      toast.error('Chart element not found')
      return
    }

    const svgElement = element.querySelector('svg')
    if (!svgElement) {
      toast.error('SVG element not found')
      return
    }

    const serializer = new XMLSerializer()
    let svgString = serializer.serializeToString(svgElement)
    
    // Add XML declaration and proper namespaces
    svgString = `<?xml version="1.0" encoding="UTF-8"?>\n${svgString}`
    
    const blob = new Blob([svgString], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.download = filename
    link.href = url
    link.click()
    
    URL.revokeObjectURL(url)
    toast.success('Chart exported as SVG')
  } catch (error) {
    console.error('SVG export failed:', error)
    toast.error('Export failed')
  }
}

/**
 * Export calculation results as CSV
 */
export function exportToCSV(
  data: any[],
  headers: string[],
  filename: string = 'data.csv'
): void {
  try {
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]
          // Escape commas and quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        }).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.download = filename
    link.href = url
    link.click()
    
    URL.revokeObjectURL(url)
    toast.success('Data exported as CSV')
  } catch (error) {
    console.error('CSV export failed:', error)
    toast.error('Export failed')
  }
}

/**
 * Export full report with multiple charts
 */
export async function exportFullReport(
  elementIds: string[],
  filename: string = 'report.pdf',
  options: {
    title?: string
    includeDate?: boolean
  } = {}
): Promise<void> {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    let currentY = 20

    // Add title
    if (options.title) {
      pdf.setFontSize(20)
      pdf.setFont('helvetica', 'bold')
      pdf.text(options.title, pdfWidth / 2, currentY, { align: 'center' })
      currentY += 15
    }

    // Add date
    if (options.includeDate) {
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.text(
        `Generated on ${new Date().toLocaleDateString('en-IN')}`,
        pdfWidth / 2,
        currentY,
        { align: 'center' }
      )
      currentY += 15
    }

    // Add each chart
    for (let i = 0; i < elementIds.length; i++) {
      const element = document.getElementById(elementIds[i])
      if (!element) continue

      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true
      })

      const imgData = canvas.toDataURL('image/png')
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min(pdfWidth / imgWidth, (pdfHeight - currentY - 20) / imgHeight)
      
      // Add new page if needed
      if (currentY + imgHeight * ratio > pdfHeight - 20) {
        pdf.addPage()
        currentY = 20
      }

      pdf.addImage(
        imgData,
        'PNG',
        10,
        currentY,
        (pdfWidth - 20),
        imgHeight * ratio * (pdfWidth - 20) / imgWidth
      )

      currentY += (imgHeight * ratio * (pdfWidth - 20) / imgWidth) + 15
    }

    pdf.save(filename)
    toast.success('Full report exported')
  } catch (error) {
    console.error('Report export failed:', error)
    toast.error('Export failed')
  }
}

/**
 * Copy chart as image to clipboard
 */
export async function copyChartToClipboard(elementId: string): Promise<void> {
  try {
    const element = document.getElementById(elementId)
    if (!element) {
      toast.error('Chart element not found')
      return
    }

    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
      useCORS: true
    })

    canvas.toBlob(async (blob) => {
      if (!blob) {
        toast.error('Failed to create image')
        return
      }

      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ])
        toast.success('Chart copied to clipboard')
      } catch (err) {
        toast.error('Clipboard access denied')
      }
    })
  } catch (error) {
    console.error('Copy to clipboard failed:', error)
    toast.error('Copy failed')
  }
}
