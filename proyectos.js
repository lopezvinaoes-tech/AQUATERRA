// Catálogo compartido por las páginas Proyectos y Ficha.
// Proyectos de Grupo Eras en Paraguay, con los datos y las fotos publicados en grupoeras.com.ar.
// Cuando haya proyectos propios, se agregan aquí con dev: window.MARCA.nombre.
// precio: USD publicado hoy en la fuente, o null para "Consultar precio".
// precioFiltro: USD aproximado solo para el filtro de inversión.
// precioPyg: precio publicado en guaraníes (se convierte con el selector de moneda).
// precioPub: último precio publicado cuando no hay uno vigente (USD, con su fecha); se muestra como referencia.
// fotos: imágenes del proyecto. Con fotosReales: true son fotos y renders publicados por la desarrolladora;
//   sin esa marca se muestran como "imagen de referencia". fotosTxt: etiqueta de cada foto (misma posición).
// mapa: dirección o lugar para Google Maps; sin mapa cuando no hay ubicación exacta publicada.
window.PROYECTOS = [
  {
    name: 'Housing Fernando de la Mora', dev: 'Grupo Eras', tipo: 'Casa', etapa: 'En construcción',
    barrio: 'Fernando de la Mora', ciudad: 'Fernando de la Mora',
    precio: null, entrega: null,
    tipologia: 'Dúplex de 2 dormitorios', dmin: 2, dmax: 2,
    facts: [['Viviendas', '9'], ['Superficie', '150 m²'], ['Complejo', 'Housing de 9 dúplex']],
    amen: ['Garaje', 'Cocina', 'Salón comedor', 'Zona de barbacoa', 'Piscina'],
    pagos: 'Financiación propia de la desarrolladora. Consulta disponibilidad y precios.',
    nota: 'Complejo de nueve viviendas dúplex pensado para familias.',
    fotosReales: true,
    fotos: ['https://grupoeras.com.ar/wp-content/uploads/2026/06/fernando-de-la-mora-hero.jpg', 'https://drive.google.com/thumbnail?id=1VdM7vICaJrKnDymOFDRh5aL5bz8JARtJ&sz=w1600', 'https://drive.google.com/thumbnail?id=1_mHTxi1DTXCGzoAk4TlSe_KObhfWAeWG&sz=w1600', 'https://drive.google.com/thumbnail?id=1q42XQSDbgvn7PRH1c-Lh29EEj39-DcyX&sz=w1600', 'https://drive.google.com/thumbnail?id=1z4m1csJYoaYVgt4QsrUZVH32BqASoKby&sz=w1600', 'https://drive.google.com/thumbnail?id=1KYwfaCpPtGNpNZEyy-_9Y67pjVHeBhoE&sz=w1600', 'https://drive.google.com/thumbnail?id=1vkrYG783YCk7lCCnZFFM3ICQMqGG86LT&sz=w1600', 'https://drive.google.com/thumbnail?id=1pSoZKKF5HkHboMDwBzCwUE5nTaDBDg0L&sz=w1600', 'https://drive.google.com/thumbnail?id=1jCS28mIgV96VOgaQ0WzwvmQC_uLG1IHB&sz=w1600', 'https://drive.google.com/thumbnail?id=1HVS84uI85mCFoR7iXhyncA86iKLIStK-&sz=w1600'],
    fotosTxt: ['Imagen del proyecto', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Render'],
    fuentes: [{ nombre: 'Grupo Eras', url: 'https://grupoeras.com.ar/projects/fernando-de-la-mora/', fecha: 'consultado en nov. 2026' }]
  },
  {
    name: 'Housing Ñanawa', dev: 'Grupo Eras', tipo: 'Casa', etapa: 'En construcción',
    barrio: 'Asunción', ciudad: 'Asunción',
    precio: null, entrega: null,
    tipologia: 'Dúplex de 3 dormitorios', dmin: 3, dmax: 3,
    facts: [['Viviendas', '9'], ['Superficie', '170 m²'], ['Complejo', 'Viviendas dúplex en cerrado']],
    amen: ['Garaje', 'Cocina', 'Salón comedor', 'Zona de barbacoa', 'Piscina opcional'],
    pagos: 'Consultar condiciones con la desarrolladora.',
    nota: 'Viviendas modernas y funcionales en un complejo residencial cerrado, pensadas para familias.',
    fotosReales: true,
    fotos: ['https://grupoeras.com.ar/wp-content/uploads/2026/06/housing-nanawa.jpg', 'https://drive.google.com/thumbnail?id=1DqYT_rv7AeHYD-lkXzrQcJTYIw9g4fSU&sz=w1600', 'https://drive.google.com/thumbnail?id=12xHRFAdz44c0L96vukVf2zhHw9xU_36o&sz=w1600', 'https://drive.google.com/thumbnail?id=19-SFMZFSS4Hj3E1XPQm_cEwgSm1V0DoL&sz=w1600', 'https://drive.google.com/thumbnail?id=1BUUU7ZswNIZseXQH1NZlZagewKCKczT7&sz=w1600', 'https://drive.google.com/thumbnail?id=156oLixXR5IPxVQXF7LueUAiSqD8NpVA1&sz=w1600', 'https://drive.google.com/thumbnail?id=15plaDdfQB6F4sbaN-kdjbCOvaMGuC1WU&sz=w1600', 'https://drive.google.com/thumbnail?id=1ahU8a17brtQ_FFHwn_uNgzcr2KDPXgUE&sz=w1600', 'https://drive.google.com/thumbnail?id=13dhryysGCx09fsd9tIRZxL28x5PzcWeB&sz=w1600', 'https://drive.google.com/thumbnail?id=13A-rlaT9UmENrnzAzwIr4RJunZ-Lz4c9&sz=w1600'],
    fotosTxt: ['Imagen del proyecto', 'Render', 'Render', 'Render', 'Render', 'Render', 'Foto real', 'Foto real', 'Foto real', 'Foto real'],
    fuentes: [{ nombre: 'Grupo Eras', url: 'https://grupoeras.com.ar/projects/housing-nanawa/', fecha: 'consultado en nov. 2026' }]
  },
  {
    name: 'Casas Limpio', dev: 'Grupo Eras', tipo: 'Casa', etapa: 'En construcción',
    barrio: 'Limpio', ciudad: 'Limpio',
    precio: null, entrega: null,
    tipologia: 'Casas de 3 dormitorios', dmin: 3, dmax: 3,
    facts: [['Viviendas', '6'], ['Superficie', '86 m²'], ['Complejo', 'Casas con 6 viviendas']],
    amen: ['Garaje', 'Cocina', 'Salón comedor', 'Zona de barbacoa', 'Piscina opcional'],
    pagos: 'Financiación propia de la desarrolladora. Consulta disponibilidad y precios.',
    nota: 'Complejo de seis casas pensado para familias.',
    fotosReales: true,
    fotos: ['https://grupoeras.com.ar/wp-content/uploads/2026/06/casas-limpio.jpg', 'https://drive.google.com/thumbnail?id=10H6gvpyBIHf6gkBbnauKVNIDXzsoFIfy&sz=w1600', 'https://drive.google.com/thumbnail?id=1Idrhde8ZZywy5NF-FmBqkRqSGZj-YxcU&sz=w1600', 'https://drive.google.com/thumbnail?id=1lcd4FnLbaR3WvC_Q8fJ7LdnSQ1p_XamE&sz=w1600', 'https://drive.google.com/thumbnail?id=16XN4NJUio1wGebzc3il_42lXSNyMUPYZ&sz=w1600', 'https://drive.google.com/thumbnail?id=1KlNk5fHXn4ldWGnSs5KsRhsTt-L7kaep&sz=w1600', 'https://drive.google.com/thumbnail?id=1zNoCAE-ofo5lCGKVN0L3is-fdcu4QdOR&sz=w1600', 'https://drive.google.com/thumbnail?id=1c73-4vJLUW3iM4BiTgLXuHgelsFspsC7&sz=w1600', 'https://drive.google.com/thumbnail?id=1UjxKhdEDwcVy8p0C6OAmJYs1VlRFBQVC&sz=w1600', 'https://drive.google.com/thumbnail?id=1Z8vuM8a3lrjj98_yOHWEzFMobI3UOxgQ&sz=w1600'],
    fotosTxt: ['Imagen del proyecto', 'Render', 'Render', 'Render', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real'],
    fuentes: [{ nombre: 'Grupo Eras', url: 'https://grupoeras.com.ar/projects/casas-limpio/', fecha: 'consultado en nov. 2026' }]
  },
  {
    name: 'Areguá Forest', dev: 'Grupo Eras', tipo: 'Country', tambien: ['Casa'], etapa: 'En construcción',
    barrio: 'Areguá', ciudad: 'Areguá',
    precio: null, entrega: null,
    tipologia: 'Casas de country de 3 dormitorios', dmin: 3, dmax: 3,
    facts: [['Tipología 1', '150 m²'], ['Tipología 2', '170 m²'], ['Tipología 3', '200 m²'], ['Complejo', 'Country con viviendas dúplex']],
    amen: ['Garaje (doble en la tipología 3)', 'Cocina', 'Salón comedor', 'Zona de barbacoa', 'Piscina'],
    pagos: 'Consultar condiciones con la desarrolladora.',
    nota: 'Tres tipologías de casa de 3 dormitorios: área social, ampliada en la tipología 2 y premium en la 3.',
    fotosReales: true,
    fotos: ['https://grupoeras.com.ar/wp-content/uploads/2026/07/aregua-forest-hero-scaled.jpg'],
    fotosTxt: ['Imagen del proyecto'],
    fuentes: [{ nombre: 'Grupo Eras', url: 'https://grupoeras.com.ar/projects/aregua-forest/', fecha: 'consultado en nov. 2026' }]
  },
  {
    name: 'Edificio Ykua Satí', dev: 'Grupo Eras', tipo: 'Departamento', etapa: 'Próximamente',
    barrio: 'Ykua Satí', ciudad: 'Asunción',
    precio: null, entrega: null,
    tipologia: '1 y 2 dormitorios', dmin: 1, dmax: 2,
    facts: [['Departamentos', '12'], ['Superficies', '45 a 78 m²'], ['Monoambiente', '45 m², 1 baño'], ['Tipo A', '48 m², 1 dorm., 1 baño'], ['Tipo B', '74 m², 2 dorm., 1 baño'], ['Tipo C', '78 m², 2 dorm., 2 baños']],
    amen: ['Estacionamiento', 'Balcón en todas las unidades', 'Piscina', 'Cocina', 'Salón comedor'],
    pagos: 'Consultar condiciones con la desarrolladora.',
    nota: 'Edificio de 12 departamentos para familias y profesionales en Asunción.',
    fotosReales: true,
    fotos: ['https://grupoeras.com.ar/wp-content/uploads/2026/06/ykua-sati.jpg'],
    fotosTxt: ['Imagen del proyecto'],
    fuentes: [{ nombre: 'Grupo Eras', url: 'https://grupoeras.com.ar/projects/ykua-sati/', fecha: 'consultado en nov. 2026' }]
  },
  {
    name: 'Dúplex Lambaré', dev: 'Grupo Eras', tipo: 'Casa', etapa: 'Entregado',
    barrio: 'Lambaré', ciudad: 'Lambaré',
    precio: null, entrega: null,
    tipologia: 'Dúplex de 3 dormitorios', dmin: 3, dmax: 3,
    facts: [['Viviendas', '2'], ['Superficie', '180 m²'], ['Plantas', 'Planta baja y planta alta']],
    amen: ['Garaje', 'Cocina', 'Salón comedor', 'Zona de barbacoa', 'Piscina opcional'],
    pagos: 'Consultar condiciones con la desarrolladora.',
    nota: 'Proyecto finalizado: dos viviendas dúplex, cómodas y funcionales, pensadas para familias.',
    fotosReales: true,
    fotos: ['https://grupoeras.com.ar/wp-content/uploads/2024/04/lambare-hero.jpg', 'https://drive.google.com/thumbnail?id=1n8yenBM6583_vL123l6_C1smxYECaxrr&sz=w1600', 'https://drive.google.com/thumbnail?id=1F_pCArI59lhNuMpFFTwnHnGrn3-c3U_1&sz=w1600', 'https://drive.google.com/thumbnail?id=15Fh1z_rjSUtu9UfIWyj38Hh3twoCChNQ&sz=w1600', 'https://drive.google.com/thumbnail?id=1Mhfu9wP6QQfnoWfb2St5F-dH_0435oGh&sz=w1600', 'https://drive.google.com/thumbnail?id=1Fs3a1qi_xPaHXbe-SXjuQy92lMTXdLhz&sz=w1600', 'https://drive.google.com/thumbnail?id=1gY7Om2XVOFb2LYeR6uovMtcQlCiCC-lO&sz=w1600', 'https://drive.google.com/thumbnail?id=1Itt9FwatH8vP_2os6O1JvV_zNGbhUv7g&sz=w1600', 'https://drive.google.com/thumbnail?id=10moMn5LCunIXnFSCA3OF-aa1ZzbYRktU&sz=w1600', 'https://drive.google.com/thumbnail?id=1ZDZxS7uBNA3LerVJhdC8_qpylu5X36JN&sz=w1600'],
    fotosTxt: ['Imagen del proyecto', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real'],
    fuentes: [{ nombre: 'Grupo Eras', url: 'https://grupoeras.com.ar/projects/lambare/', fecha: 'consultado en nov. 2026' }]
  },
  {
    name: 'Dúplex Luque', dev: 'Grupo Eras', tipo: 'Casa', etapa: 'Entregado',
    barrio: 'Luque', ciudad: 'Luque',
    precio: null, entrega: null,
    tipologia: 'Dúplex de 3 dormitorios, 2 tipologías', dmin: 3, dmax: 3,
    facts: [['Viviendas', '4'], ['Tipología 1', '180 m²'], ['Tipología 2', '150 m²'], ['Plantas', 'Planta baja y planta alta']],
    amen: ['Garaje', 'Cocina', 'Salón comedor', 'Zona de barbacoa', 'Piscina opcional'],
    pagos: 'Consultar condiciones con la desarrolladora.',
    nota: 'Proyecto finalizado: dúplex modernos de diseño eficiente, pensados para familias.',
    fotosReales: true,
    fotos: ['https://grupoeras.com.ar/wp-content/uploads/2026/06/duplex-luque.jpg'],
    fotosTxt: ['Imagen del proyecto'],
    fuentes: [{ nombre: 'Grupo Eras', url: 'https://grupoeras.com.ar/projects/duplex-luque/', fecha: 'consultado en nov. 2026' }]
  }
];
