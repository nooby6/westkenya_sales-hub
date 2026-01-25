import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface OrderData {
  order_number: string;
  order_date: string;
  status: string;
  total_amount: number;
  customers?: { name: string; company_name?: string };
  depots?: { name: string };
}

interface InventoryData {
  quantity: number;
  products?: { name: string; sku: string; unit_price: number };
  depots?: { name: string };
}

interface ShipmentData {
  id: string;
  driver_name: string;
  driver_phone: string;
  driver_id_number: string;
  vehicle_number_plate: string;
  status: string;
  created_at: string;
  delivered_at?: string;
  sales_orders?: { order_number: string; customers?: { name: string } };
}

export const generateOrdersPDF = (orders: OrderData[], dateRange: { from: string; to: string }) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(34, 139, 34); // Forest green
  doc.text('Kabras Sugar - Sales Orders Report', 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${format(new Date(), 'PPpp')}`, 14, 30);
  doc.text(`Date Range: ${dateRange.from} to ${dateRange.to}`, 14, 36);
  
  // Summary stats
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text('Summary', 14, 48);
  doc.setFontSize(10);
  doc.text(`Total Orders: ${orders.length}`, 14, 56);
  doc.text(`Total Revenue: KES ${totalRevenue.toLocaleString()}`, 14, 62);
  doc.text(`Status Breakdown: ${Object.entries(statusCounts).map(([k, v]) => `${k}: ${v}`).join(', ')}`, 14, 68);
  
  // Table
  const tableData = orders.map(order => [
    order.order_number,
    order.customers?.name || '-',
    order.depots?.name || '-',
    `KES ${Number(order.total_amount).toLocaleString()}`,
    order.status.toUpperCase(),
    format(new Date(order.order_date), 'MMM dd, yyyy'),
  ]);
  
  autoTable(doc, {
    head: [['Order #', 'Customer', 'Depot', 'Amount', 'Status', 'Date']],
    body: tableData,
    startY: 76,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [34, 139, 34] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Page ${i} of ${pageCount} - Kabras Sugar Sales Management System`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }
  
  return doc;
};

export const generateInventoryPDF = (inventory: InventoryData[]) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(34, 139, 34);
  doc.text('Kabras Sugar - Inventory Report', 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${format(new Date(), 'PPpp')}`, 14, 30);
  
  // Summary
  const totalItems = inventory.length;
  const totalUnits = inventory.reduce((sum, i) => sum + i.quantity, 0);
  const totalValue = inventory.reduce(
    (sum, i) => sum + i.quantity * Number(i.products?.unit_price || 0),
    0
  );
  const lowStockItems = inventory.filter(
    i => i.quantity < 100
  ).length;
  
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text('Summary', 14, 42);
  doc.setFontSize(10);
  doc.text(`Total Products: ${totalItems}`, 14, 50);
  doc.text(`Total Units in Stock: ${totalUnits.toLocaleString()}`, 14, 56);
  doc.text(`Total Inventory Value: KES ${totalValue.toLocaleString()}`, 14, 62);
  doc.text(`Low Stock Alerts: ${lowStockItems}`, 14, 68);
  
  // Table
  const tableData = inventory.map(item => [
    item.products?.sku || '-',
    item.products?.name || '-',
    item.depots?.name || '-',
    item.quantity.toLocaleString(),
    `KES ${Number(item.products?.unit_price || 0).toLocaleString()}`,
    `KES ${(item.quantity * Number(item.products?.unit_price || 0)).toLocaleString()}`,
  ]);
  
  autoTable(doc, {
    head: [['SKU', 'Product', 'Depot', 'Quantity', 'Unit Price', 'Total Value']],
    body: tableData,
    startY: 76,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [34, 139, 34] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Page ${i} of ${pageCount} - Kabras Sugar Sales Management System`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }
  
  return doc;
};

export const generateShipmentsPDF = (shipments: ShipmentData[], dateRange: { from: string; to: string }) => {
  const doc = new jsPDF('landscape');
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(34, 139, 34);
  doc.text('Kabras Sugar - Shipments Report', 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${format(new Date(), 'PPpp')}`, 14, 30);
  doc.text(`Date Range: ${dateRange.from} to ${dateRange.to}`, 14, 36);
  
  // Summary
  const statusCounts = shipments.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text('Summary', 14, 48);
  doc.setFontSize(10);
  doc.text(`Total Shipments: ${shipments.length}`, 14, 56);
  doc.text(`Status: ${Object.entries(statusCounts).map(([k, v]) => `${k}: ${v}`).join(', ')}`, 14, 62);
  
  // Table
  const tableData = shipments.map(shipment => [
    shipment.sales_orders?.order_number || '-',
    shipment.sales_orders?.customers?.name || '-',
    shipment.driver_name,
    shipment.driver_phone,
    shipment.driver_id_number,
    shipment.vehicle_number_plate,
    shipment.status.toUpperCase(),
    format(new Date(shipment.created_at), 'MMM dd, yyyy'),
    shipment.delivered_at ? format(new Date(shipment.delivered_at), 'MMM dd, yyyy') : '-',
  ]);
  
  autoTable(doc, {
    head: [['Order #', 'Customer', 'Driver', 'Phone', 'ID Number', 'Vehicle', 'Status', 'Created', 'Delivered']],
    body: tableData,
    startY: 70,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [34, 139, 34] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Page ${i} of ${pageCount} - Kabras Sugar Sales Management System`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }
  
  return doc;
};

export const downloadPDF = (doc: jsPDF, filename: string) => {
  doc.save(filename);
};
