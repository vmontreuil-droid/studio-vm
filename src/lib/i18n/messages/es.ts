import type { Messages } from "./nl";
// Importación relativa: Playwright carga este archivo sin el alias @/.
import { UURTARIEF_CENT, MINIMUM_UREN, euro } from "../../tarieven";

const P = euro(UURTARIEF_CENT.vroegtijdig, "es");

const es: Messages = {
  meta: {
    siteName: "Studio VM",
    title: "Modelos 3D para control de maquinaria GPS | Studio VM",
    description: `Sus planos 2D como modelo 3D para excavadoras, motoniveladoras y bulldozers con GPS: Trimble, Topcon, Leica, Unicontrol y más. Desde ${P}/h, IVA aparte.`,
    locale: "es_ES",
  },
  nav: {
    werk: "Proyectos",
    mogelijkheden: "Servicios",
    pricing: "Tarifas",
    contact: "Contacto",
    search: "Buscar",
    menu: "Menú",
    over: "Sobre Studio VM",
  },
  aanbod: {
    prijsregel: `Desde ${P} por hora, IVA no incluido · mínimo ${MINIMUM_UREN} hora · sistemas adicionales gratis · urgente en 5 días laborables`,
  },
  contact: {
    eyebrow: "Contacto",
    title: "¿Tiene un proyecto en marcha o simplemente una pregunta?",
    intro:
      "Envíenos un mensaje, o llámenos o escríbanos directamente. Normalmente respondemos el mismo día. ¿Ya tiene los planos? Solicite un presupuesto directamente y los revisaremos.",
    location: "Flandes Occidental, Bélgica",
  },
  contactForm: {
    name: "Nombre",
    email: "Correo electrónico",
    subject: "Asunto",
    body: "Mensaje",
    namePlaceholder: "Juan García",
    emailPlaceholder: "juan@constructora.es",
    subjectPlaceholder: "Movimiento de tierras para un polígono industrial",
    bodyPlaceholder:
      "¿De qué tipo de proyecto se trata? ¿Qué sistema de control de máquinas utiliza? ¿Para cuándo necesita el modelo?",
    submit: "Enviar mensaje",
    submitting: "Enviando...",
    openMail: "Abrir en el cliente de correo",
  },
  footer: {
    tagline: "Studio VM — modelos 3D para control de maquinaria, en toda Europa.",
    sections: {
      studio: "Estudio",
      diensten: "Servicios",
      klanten: "Para clientes",
      over: "Sobre Studio VM",
      legal: "Legal",
    },
    built: "Modelado en Anzegem, entregado en toda Europa.",
  },
};

export default es;
