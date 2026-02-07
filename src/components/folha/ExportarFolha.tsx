'use client';

import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

export interface ItemFolha {
  nome: string;
  total_horas: number;
  valor_hora: number;
  total_pagar: number;
}

export function exportarPDF(itens: ItemFolha[], periodo: string) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('Folha de Pagamento', 14, 20);
  doc.setFontSize(10);
  doc.text(`Período: ${periodo}`, 14, 28);
  doc.setFontSize(9);

  const headers = ['Nome', 'Horas', 'R$/hora', 'Total'];
  let y = 38;

  doc.setFont('helvetica', 'bold');
  doc.text(headers[0], 14, y);
  doc.text(headers[1], 84, y);
  doc.text(headers[2], 109, y);
  doc.text(headers[3], 144, y);
  y += 6;
  doc.setFont('helvetica', 'normal');

  let totalGeral = 0;
  for (const item of itens) {
    doc.text(item.nome.substring(0, 35), 14, y);
    doc.text(item.total_horas.toFixed(2), 84, y);
    doc.text(`R$ ${item.valor_hora.toFixed(2).replace('.', ',')}`, 109, y);
    doc.text(`R$ ${item.total_pagar.toFixed(2).replace('.', ',')}`, 144, y);
    totalGeral += item.total_pagar;
    y += 6;
  }

  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Geral: R$ ${totalGeral.toFixed(2).replace('.', ',')}`, 14, y);
  doc.setFont('helvetica', 'normal');

  doc.save(`folha-pagamento-${periodo.replace(/\//g, '-')}.pdf`);
}

export function exportarExcel(itens: ItemFolha[], periodo: string) {
  const ws = XLSX.utils.json_to_sheet(
    itens.map((i) => ({
      Nome: i.nome,
      'Total Horas': i.total_horas,
      'R$/hora': i.valor_hora,
      'Total a Pagar': i.total_pagar,
    }))
  );
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Folha');
  XLSX.writeFile(wb, `folha-pagamento-${periodo.replace(/\//g, '-')}.xlsx`);
}
