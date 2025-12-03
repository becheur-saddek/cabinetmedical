import { jsPDF } from 'jspdf';
import { Patient, Prescription } from '../types';
import { db } from '../services/db';

const addCommonHeader = (doc: jsPDF, doctor: any) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 100, 150);
  doc.text(doctor.name, 20, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(doctor.specialty, 20, 26);
  
  doc.text(doctor.address, 20, 31);
  doc.text(`Tél: ${doctor.phone}`, 20, 36);
  doc.text(`Email: ${doctor.email}`, 20, 41);

  doc.setDrawColor(200);
  doc.line(20, 45, pageWidth - 20, 45);
};

const addCommonFooter = (doc: jsPDF, pageHeight: number, pageWidth: number) => {
  const quote = '"La vie d\'un patient dépend d\'une goutte de votre sang"';
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(150);
  doc.text(quote, pageWidth / 2, pageHeight - 15, { align: 'center' });
};

export const generatePrescriptionPDF = (patient: Patient, prescription: Prescription) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const doctor = db.getDoctorProfile();
  
  addCommonHeader(doc, doctor);

  // Date
  doc.setTextColor(0);
  doc.setFontSize(11);
  const dateStr = new Date(prescription.date).toLocaleDateString('fr-FR');
  doc.text(`Le ${dateStr}`, pageWidth - 60, 60);

  // Patient Info Box
  doc.setFont('helvetica', 'bold');
  doc.text("Patient(e):", 20, 60);
  doc.setFont('helvetica', 'normal');
  doc.text(`${patient.firstName} ${patient.lastName}`, 50, 60);
  
  doc.setFont('helvetica', 'bold');
  doc.text("Âge:", 20, 66);
  doc.setFont('helvetica', 'normal');
  const age = new Date().getFullYear() - new Date(patient.birthDate).getFullYear();
  doc.text(`${age} ans`, 50, 66);

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text("ORDONNANCE", pageWidth / 2, 90, { align: 'center' });

  // Medications
  let yPos = 110;
  
  prescription.medications.forEach((med, index) => {
    if (yPos > 240) {
      doc.addPage();
      yPos = 30;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`• ${med.name} ${med.dosage}`, 25, yPos);
    
    yPos += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(60);
    doc.text(med.instructions, 30, yPos);
    
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(`Durée: ${med.duration}`, 30, yPos);
    
    yPos += 15;
    doc.setTextColor(0);
  });

  // Footer Signature
  const signatureY = Math.max(yPos + 20, 240);
  doc.setFontSize(11);
  doc.text("Signature & Cachet", pageWidth - 70, signatureY);
  
  addCommonFooter(doc, pageHeight, pageWidth);

  doc.save(`Ordonnance_${patient.lastName}_${dateStr}.pdf`);
  alert("L'ordonnance a été générée et téléchargée.");
};

export const generateReferralPDF = (patient: Patient, content: string) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const doctor = db.getDoctorProfile();
  
  addCommonHeader(doc, doctor);

  const dateStr = new Date().toLocaleDateString('fr-FR');
  doc.setTextColor(0);
  doc.setFontSize(11);
  doc.text(`Le ${dateStr}`, pageWidth - 60, 60);

  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text("LETTRE D'ORIENTATION", pageWidth / 2, 80, { align: 'center' });

  // Patient Info (Inline)
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Concernant le patient: ${patient.firstName} ${patient.lastName}`, 20, 100);
  const age = new Date().getFullYear() - new Date(patient.birthDate).getFullYear();
  doc.text(`Âge: ${age} ans`, 20, 107);

  // Body Content
  doc.setFontSize(12);
  const splitText = doc.splitTextToSize(content, pageWidth - 40);
  doc.text(splitText, 20, 125);

  // Footer Signature
  doc.setFontSize(11);
  doc.text("Confraternellement,", pageWidth - 70, 220);
  doc.text("Signature & Cachet", pageWidth - 70, 235);

  addCommonFooter(doc, pageHeight, pageWidth);

  doc.save(`Orientation_${patient.lastName}.pdf`);
  alert("Lettre d'orientation générée.");
};

export const generateSickLeavePDF = (patient: Patient, days: number, startDate: string, endDate: string) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const doctor = db.getDoctorProfile();
  
  addCommonHeader(doc, doctor);

  const dateStr = new Date().toLocaleDateString('fr-FR');
  doc.setTextColor(0);
  doc.setFontSize(11);
  doc.text(`Fait à ${doctor.address.split(',')[1] || 'Constantine'}, le ${dateStr}`, pageWidth - 80, 60);

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text("CERTIFICAT DE MALADIE", pageWidth / 2, 90, { align: 'center' });
  doc.setFontSize(14);
  doc.text("(Arrêt de travail)", pageWidth / 2, 98, { align: 'center' });

  // Body
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const bodyY = 130;
  const lineHeight = 10;

  doc.text(`Je soussigné(e), Dr. ${doctor.name},`, 20, bodyY);
  doc.text(`Certifie avoir examiné ce jour le patient:`, 20, bodyY + lineHeight);
  
  doc.setFont('helvetica', 'bold');
  doc.text(`${patient.lastName} ${patient.firstName}`, 95, bodyY + lineHeight);
  
  doc.setFont('helvetica', 'normal');
  const age = new Date().getFullYear() - new Date(patient.birthDate).getFullYear();
  doc.text(`(Âgé de ${age} ans)`, 20, bodyY + lineHeight * 2);

  doc.text(`Et déclare que son état de santé nécessite un repos de :`, 20, bodyY + lineHeight * 3.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`${days} Jours`, 125, bodyY + lineHeight * 3.5);

  doc.setFont('helvetica', 'normal');
  doc.text(`Sauf complications, du :`, 20, bodyY + lineHeight * 4.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`${new Date(startDate).toLocaleDateString('fr-FR')}`, 70, bodyY + lineHeight * 4.5);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Au :`, 110, bodyY + lineHeight * 4.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`${new Date(endDate).toLocaleDateString('fr-FR')}`, 125, bodyY + lineHeight * 4.5);
  doc.text(`(inclus)`, 160, bodyY + lineHeight * 4.5);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10);
  doc.text("Certificat remis en main propre pour servir et valoir ce que de droit.", 20, bodyY + lineHeight * 7);

  // Footer Signature
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text("Signature & Cachet", pageWidth - 70, 240);

  addCommonFooter(doc, pageHeight, pageWidth);

  doc.save(`Arret_Travail_${patient.lastName}.pdf`);
  alert("Certificat de maladie généré.");
};