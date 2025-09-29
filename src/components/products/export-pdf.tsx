'use client';

import * as React from 'react';
import Button from '@mui/material/Button';
import { FilePdfIcon } from '@phosphor-icons/react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { Product } from '@/contexts/product-context';

dayjs.extend(utc);
dayjs.extend(timezone);

interface ExportPdfButtonProps {
  products: Product[];
}

export const ExportPdfButton: React.FC<ExportPdfButtonProps> = ({ products }) => {
  const handleExportPdf = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Products List</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
            h2 { text-align: center; color: #333; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #333; padding: 8px; text-align: left; font-size: 11px; }
            th { background-color: #f0f0f0; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .header { text-align: center; margin-bottom: 20px; }
            .date { font-size: 10px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Products List</h2>
            <div class="date">Generated on ${dayjs().format('MMMM D, YYYY h:mm A')}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Price (AED)</th>
                <th>Category</th>
                <th>Product ID</th>
                <th>Last Edited</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              ${products.map(product => `
                <tr>
                  <td>${product.name}</td>
                  <td>${product.price.toFixed(2)} AED</td>
                  <td>${product.category === 'bakery' ? 'Bakery' : 'Fresh'}</td>
                  <td>${product.id}</td>
                  <td>${dayjs(product.updatedAt).tz('Asia/Dubai').format('MMM D, YYYY h:mm A')} GST</td>
                  <td>${dayjs(product.createdAt).tz('Asia/Dubai').format('MMM D, YYYY')} GST</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow?.document.write(htmlContent);
    printWindow?.document.close();

    setTimeout(() => {
      printWindow?.print();
    }, 500);
  };

  return (
    <Button
      color="inherit"
      startIcon={<FilePdfIcon fontSize="var(--icon-fontSize-md)" />}
      onClick={handleExportPdf}
    >
      PDF
    </Button>
  );
};


  // const handleExportPdf = () => {
  //   const htmlContent = `
  //     <!DOCTYPE html>
  //     <html>
  //       <head>
  //         <title>Products List</title>
  //         <style>
  //           body { 
  //             font-family: Arial, sans-serif; 
  //             margin: 20px; 
  //             font-size: 12px;
  //           }
  //           h2 { 
  //             text-align: center; 
  //             color: #333; 
  //             margin-bottom: 20px;
  //           }
  //           table { 
  //             width: 100%; 
  //             border-collapse: collapse; 
  //             margin-top: 10px;
  //           }
  //           th, td { 
  //             border: 1px solid #333; 
  //             padding: 8px; 
  //             text-align: left; 
  //             font-size: 11px;
  //           }
  //           th { 
  //             background-color: #f0f0f0; 
  //             font-weight: bold;
  //           }
  //           tr:nth-child(even) {
  //             background-color: #f9f9f9;
  //           }
  //           .header {
  //             text-align: center;
  //             margin-bottom: 20px;
  //           }
  //           .date {
  //             font-size: 10px;
  //             color: #666;
  //           }
  //         </style>
  //       </head>
  //       <body>
  //         <div class="header">
  //           <h2>Products List</h2>
  //           <div class="date">Generated on ${dayjs().format('MMMM D, YYYY h:mm A')}</div>
  //         </div>
  //         <table>
  //           <thead>
  //             <tr>
  //               <th>Product Name</th>
  //               <th>Price (AED)</th>
  //               <th>Category</th>
  //               <th>Product ID</th>
  //               <th>Last Edited</th>
  //               <th>Created</th>
  //             </tr>
  //           </thead>
  //           <tbody>
  //             ${filteredProducts.map(product => `
  //               <tr>
  //                 <td>${product.name}</td>
  //                 <td>${product.price.toFixed(2)} AED</td>
  //                 <td>${product.category === 'bakery' ? 'Bakery' : 'Fresh'}</td>
  //                 <td>${product.id}</td>
  //                 <td>${dayjs(product.updatedAt).tz('Asia/Dubai').format('MMM D, YYYY h:mm A')} GST</td>
  //                 <td>${dayjs(product.createdAt).tz('Asia/Dubai').format('MMM D, YYYY')} GST</td>
  //               </tr>
  //             `).join('')}
  //           </tbody>
  //         </table>
  //       </body>
  //     </html>
  //   `;

  //   // Open in new tab and trigger download
  //   const printWindow = window.open('', '_blank');
  //   printWindow?.document.write(htmlContent);
  //   printWindow?.document.close();

  //   // Wait for content to load, then trigger print
  //   setTimeout(() => {
  //     printWindow?.print();
  //   }, 500);
  // };