// Catálogo compartido por las páginas Proyectos y Ficha.
// Proyectos propios en Paraguay (dev: window.MARCA.nombre). Los proyectos propios no llevan fuente (fuentes: []).
// Si se agrega un proyecto de otra desarrolladora, se le pone dev con su nombre y fuentes con la fuente y la fecha del dato.
// precio: USD publicado hoy en la fuente, o null para "Consultar precio".
// precioFiltro: USD aproximado solo para el filtro de inversión.
// precioPyg: precio publicado en guaraníes (se convierte con el selector de moneda).
// precioPub: último precio publicado cuando no hay uno vigente (USD, con su fecha); se muestra como referencia.
// fotos: imágenes del proyecto. Con fotosReales: true son fotos y renders publicados por la desarrolladora;
//   sin esa marca se muestran como "imagen de referencia". fotosTxt: etiqueta de cada foto (misma posición).
var AQ_PROPIA = (window.MARCA && window.MARCA.nombre) || 'Aquaterra';
// mapa: dirección o lugar para Google Maps; sin mapa cuando no hay ubicación exacta publicada.
window.PROYECTOS = [
  {
    name: 'Housing Fernando de la Mora', dev: AQ_PROPIA, tipo: 'Casa', etapa: 'En construcción',
    barrio: 'Fernando de la Mora', ciudad: 'Fernando de la Mora',
    precio: null, entrega: null,
    tipologia: 'Dúplex de 2 dormitorios', dmin: 2, dmax: 2,
    facts: [['Viviendas', '9'], ['Superficie', '150 m²'], ['Complejo', 'Housing de 9 dúplex']],
    amen: ['Garaje', 'Cocina', 'Salón comedor', 'Zona de barbacoa', 'Piscina'],
    pagos: 'Financiación propia de la desarrolladora. Consulta disponibilidad y precios.',
    nota: 'Complejo de nueve viviendas dúplex pensado para familias.',
    fotosReales: true,
    fotos: ['https://grupoeras.com.ar/wp-content/uploads/2026/06/fernando-de-la-mora-hero.jpg', 'https://drive.google.com/thumbnail?id=1iXsGZ8Lx9Emlg9537x-eL0cci95mIvEw&sz=w1600', 'https://drive.google.com/thumbnail?id=1WZpI_ZgYfQhIdok71K36xhOru6e0QHhN&sz=w1600', 'https://drive.google.com/thumbnail?id=1HVS84uI85mCFoR7iXhyncA86iKLIStK-&sz=w1600', 'https://drive.google.com/thumbnail?id=1VdM7vICaJrKnDymOFDRh5aL5bz8JARtJ&sz=w1600', 'https://drive.google.com/thumbnail?id=1_mHTxi1DTXCGzoAk4TlSe_KObhfWAeWG&sz=w1600', 'https://drive.google.com/thumbnail?id=1GDU0URB4IuJoPv93U_p4F9rDheKNqNZz&sz=w1600', 'https://drive.google.com/thumbnail?id=1F8eu6-XIq5P0eaAX-603VScPs8rQxvkA&sz=w1600', 'https://drive.google.com/thumbnail?id=12Rs5hjle2AQ6PfVDceiZh9ivJ0rF6y8R&sz=w1600', 'https://drive.google.com/thumbnail?id=1Z-s3llYPegZ6n9FzM6mDskR00tLxjdmI&sz=w1600', 'https://drive.google.com/thumbnail?id=1KYwfaCpPtGNpNZEyy-_9Y67pjVHeBhoE&sz=w1600', 'https://drive.google.com/thumbnail?id=1q42XQSDbgvn7PRH1c-Lh29EEj39-DcyX&sz=w1600', 'https://drive.google.com/thumbnail?id=1z4m1csJYoaYVgt4QsrUZVH32BqASoKby&sz=w1600', 'https://drive.google.com/thumbnail?id=1vkrYG783YCk7lCCnZFFM3ICQMqGG86LT&sz=w1600', 'https://drive.google.com/thumbnail?id=1pSoZKKF5HkHboMDwBzCwUE5nTaDBDg0L&sz=w1600', 'https://drive.google.com/thumbnail?id=1jCS28mIgV96VOgaQ0WzwvmQC_uLG1IHB&sz=w1600'],
    fotosTxt: ['Imagen del proyecto', 'Render', 'Render', 'Render', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real'],
    fuentes: []
  },
  {
    name: 'Housing Ñanawa', dev: AQ_PROPIA, tipo: 'Casa', etapa: 'En construcción',
    barrio: 'Asunción', ciudad: 'Asunción',
    precio: null, entrega: null,
    tipologia: 'Dúplex de 3 dormitorios', dmin: 3, dmax: 3,
    facts: [['Viviendas', '9'], ['Superficie', '170 m²'], ['Complejo', 'Viviendas dúplex en cerrado']],
    amen: ['Garaje', 'Cocina', 'Salón comedor', 'Zona de barbacoa', 'Piscina opcional'],
    pagos: 'Consultar condiciones con la desarrolladora.',
    nota: 'Viviendas modernas y funcionales en un complejo residencial cerrado, pensadas para familias.',
    fotosReales: true,
    fotos: ['https://grupoeras.com.ar/wp-content/uploads/2026/06/housing-nanawa.jpg', 'https://drive.google.com/thumbnail?id=1DqYT_rv7AeHYD-lkXzrQcJTYIw9g4fSU&sz=w1600', 'https://drive.google.com/thumbnail?id=12xHRFAdz44c0L96vukVf2zhHw9xU_36o&sz=w1600', 'https://drive.google.com/thumbnail?id=19-SFMZFSS4Hj3E1XPQm_cEwgSm1V0DoL&sz=w1600', 'https://drive.google.com/thumbnail?id=1I6rKAQ_sLq8Ffdv1JPg7496FaZpwcSo-&sz=w1600', 'https://drive.google.com/thumbnail?id=1ufzu6I0wLj4lSsETb75UKtAY5xwQ2RQu&sz=w1600', 'https://drive.google.com/thumbnail?id=1Ud-RdzLibU9OzmNIwDcKugXmtp9KoHjw&sz=w1600', 'https://drive.google.com/thumbnail?id=1JoygW2_At2FPr6xdjuy5LXASybjlcjvR&sz=w1600', 'https://drive.google.com/thumbnail?id=18pkh_JgH0b4j7hP75TIciz-b-Gx8tvJS&sz=w1600', 'https://drive.google.com/thumbnail?id=1PJz63eGV5d1cq8KmrkQbEbYTxW7YOJqW&sz=w1600', 'https://drive.google.com/thumbnail?id=1BUUU7ZswNIZseXQH1NZlZagewKCKczT7&sz=w1600', 'https://drive.google.com/thumbnail?id=1Wx9NrgJzcoULs46Q_qRVuwYk5JiZVZTy&sz=w1600', 'https://drive.google.com/thumbnail?id=1lXICwEf-eA4CsYk0gZflCwJLHfs6e_V8&sz=w1600', 'https://drive.google.com/thumbnail?id=156oLixXR5IPxVQXF7LueUAiSqD8NpVA1&sz=w1600', 'https://drive.google.com/thumbnail?id=1BHZQ0TAim2pu6OfVOGzi_KsXLJU-mX98&sz=w1600', 'https://drive.google.com/thumbnail?id=12q90rIyvo-x2grwGI1FqZI5V8A49u5n4&sz=w1600', 'https://drive.google.com/thumbnail?id=1O5oIAFbNCWKc3RauUeL5Q2M-TLT3ql1j&sz=w1600', 'https://drive.google.com/thumbnail?id=13atHsannwRZGmaFT60e1Zf3SYhCrx1Z9&sz=w1600', 'https://drive.google.com/thumbnail?id=1c6jeJ4TJTJnJ7qm0gPXA7YLAsJYEMpg9&sz=w1600', 'https://drive.google.com/thumbnail?id=15plaDdfQB6F4sbaN-kdjbCOvaMGuC1WU&sz=w1600', 'https://drive.google.com/thumbnail?id=1amV9K83dmNU3W0P5EzhTGQZ__R7dmBPu&sz=w1600', 'https://drive.google.com/thumbnail?id=1ahU8a17brtQ_FFHwn_uNgzcr2KDPXgUE&sz=w1600', 'https://drive.google.com/thumbnail?id=13dhryysGCx09fsd9tIRZxL28x5PzcWeB&sz=w1600', 'https://drive.google.com/thumbnail?id=13A-rlaT9UmENrnzAzwIr4RJunZ-Lz4c9&sz=w1600'],
    fotosTxt: ['Imagen del proyecto', 'Render', 'Render', 'Render', 'Render', 'Render', 'Render', 'Render', 'Render', 'Render', 'Render', 'Render', 'Render', 'Render', 'Render', 'Render', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real'],
    fuentes: []
  },
  {
    name: 'Casas Limpio', dev: AQ_PROPIA, tipo: 'Casa', etapa: 'En construcción',
    barrio: 'Limpio', ciudad: 'Limpio',
    precio: null, entrega: null,
    tipologia: 'Casas de 3 dormitorios', dmin: 3, dmax: 3,
    facts: [['Viviendas', '6'], ['Superficie', '86 m²'], ['Complejo', 'Casas con 6 viviendas']],
    amen: ['Garaje', 'Cocina', 'Salón comedor', 'Zona de barbacoa', 'Piscina opcional'],
    pagos: 'Financiación propia de la desarrolladora. Consulta disponibilidad y precios.',
    nota: 'Complejo de seis casas pensado para familias.',
    fotosReales: true,
    fotos: ['https://grupoeras.com.ar/wp-content/uploads/2026/06/casas-limpio.jpg', 'https://drive.google.com/thumbnail?id=10H6gvpyBIHf6gkBbnauKVNIDXzsoFIfy&sz=w1600', 'https://drive.google.com/thumbnail?id=15bBkAmxyDAipqT46SFpBWdMsHAFadXYj&sz=w1600', 'https://drive.google.com/thumbnail?id=1v3elmDw1JVeFITiBN03rNo3jdo-9Btt7&sz=w1600', 'https://drive.google.com/thumbnail?id=1Idrhde8ZZywy5NF-FmBqkRqSGZj-YxcU&sz=w1600', 'https://drive.google.com/thumbnail?id=1n8KB-8DUGEhSmNIdTWjRFe97brR0x_VS&sz=w1600', 'https://drive.google.com/thumbnail?id=1lcd4FnLbaR3WvC_Q8fJ7LdnSQ1p_XamE&sz=w1600', 'https://drive.google.com/thumbnail?id=1lgPJeR3phz5ynZl1nTLDDPwLXgwTNsCz&sz=w1600', 'https://drive.google.com/thumbnail?id=16XN4NJUio1wGebzc3il_42lXSNyMUPYZ&sz=w1600', 'https://drive.google.com/thumbnail?id=1KlNk5fHXn4ldWGnSs5KsRhsTt-L7kaep&sz=w1600', 'https://drive.google.com/thumbnail?id=1zB4GxQdiqtqnSCZHUhvdgSl2HgAwafTQ&sz=w1600', 'https://drive.google.com/thumbnail?id=1uY07a_-3l3iSqWCZ9x7nwpH2BNNCMD5K&sz=w1600', 'https://drive.google.com/thumbnail?id=1zNoCAE-ofo5lCGKVN0L3is-fdcu4QdOR&sz=w1600', 'https://drive.google.com/thumbnail?id=1l3GQmuqZ9kIXAT3tC42TNoK-MgKnU-cp&sz=w1600', 'https://drive.google.com/thumbnail?id=1s030C9G6odq5qWcY7FpbxBJdZbeEz0pb&sz=w1600', 'https://drive.google.com/thumbnail?id=1R8SpM9jETQcYTelH0Izk3LsPxCC1M7Jt&sz=w1600', 'https://drive.google.com/thumbnail?id=1c73-4vJLUW3iM4BiTgLXuHgelsFspsC7&sz=w1600', 'https://drive.google.com/thumbnail?id=1fBCv_mrhPjxoaaQs3r05wm0uP5eDNzFx&sz=w1600', 'https://drive.google.com/thumbnail?id=1UjxKhdEDwcVy8p0C6OAmJYs1VlRFBQVC&sz=w1600', 'https://drive.google.com/thumbnail?id=1Z8vuM8a3lrjj98_yOHWEzFMobI3UOxgQ&sz=w1600'],
    fotosTxt: ['Imagen del proyecto', 'Render', 'Render', 'Render', 'Render', 'Render', 'Render', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real'],
    fuentes: []
  },
  {
    name: 'Areguá Forest', dev: AQ_PROPIA, tipo: 'Country', tambien: ['Casa'], etapa: 'En construcción',
    barrio: 'Areguá', ciudad: 'Areguá',
    precio: null, entrega: null,
    tipologia: 'Casas de country de 3 dormitorios', dmin: 3, dmax: 3,
    facts: [['Tipología 1', '150 m²'], ['Tipología 2', '170 m²'], ['Tipología 3', '200 m²'], ['Complejo', 'Country con viviendas dúplex']],
    amen: ['Garaje (doble en la tipología 3)', 'Cocina', 'Salón comedor', 'Zona de barbacoa', 'Piscina'],
    pagos: 'Consultar condiciones con la desarrolladora.',
    nota: 'Tres tipologías de casa de 3 dormitorios: área social, ampliada en la tipología 2 y premium en la 3.',
    fotosReales: true,
    fotos: ['https://grupoeras.com.ar/wp-content/uploads/2026/07/aregua-forest-hero-scaled.jpg', 'https://drive.google.com/thumbnail?id=1MgFl_2iX2iEKbM4MvuY378lBmy0QvEVd&sz=w1600', 'https://drive.google.com/thumbnail?id=1vw1iDX1odvdUP4wy1QEMk0TutQiLbgBs&sz=w1600', 'https://drive.google.com/thumbnail?id=1aZVnZJ9nF5QV5532pPLOVa7alUqIL_kK&sz=w1600', 'https://drive.google.com/thumbnail?id=1B5ql9aIYdkTTMI7fQHUoFnAtOkoUorbm&sz=w1600', 'https://drive.google.com/thumbnail?id=1deW25f_a1Oe6F2kXCY0C0-vOt3DGUHwd&sz=w1600', 'https://drive.google.com/thumbnail?id=1TQK0UAzJdFdunRLOqWRcn2o7GbYZkxeR&sz=w1600', 'https://drive.google.com/thumbnail?id=1yclPNjuyFMks0J3qF1HVqdvGNJYUrX_r&sz=w1600', 'https://drive.google.com/thumbnail?id=1bk_GQvdGtVawQoIg1voPhwfnjJHOZFen&sz=w1600', 'https://drive.google.com/thumbnail?id=1vPpv8WynZbUqdOw8phrrcsr9siAYNn24&sz=w1600', 'https://drive.google.com/thumbnail?id=1n42QgfePPDrMkNvJABRECN8_-boMI3dZ&sz=w1600', 'https://drive.google.com/thumbnail?id=1VE1NTxXlG1qkGMiT9rlU1_d9VUQvM8Lq&sz=w1600', 'https://drive.google.com/thumbnail?id=1w7mV1X70OmXckLhV8BGWhmcuL35_MWZB&sz=w1600', 'https://drive.google.com/thumbnail?id=1OiiUivC-PVUS7xdiO6FT4Gte3OtL2mGZ&sz=w1600', 'https://drive.google.com/thumbnail?id=1Tw-caFAGXQnPtwFsRYCjbBZ5AvIhnE9v&sz=w1600', 'https://drive.google.com/thumbnail?id=1uJznB4p0tTcH9xDoMpaogJYiCCZYjmJI&sz=w1600', 'https://drive.google.com/thumbnail?id=1IdHAellRccf-rVsOdQd_V7EzYHpcnRe9&sz=w1600', 'https://drive.google.com/thumbnail?id=1d8WKqKm8KLcAqEJgeMg5o3sjsn0L1cAH&sz=w1600', 'https://drive.google.com/thumbnail?id=1rbcDGH0aSzVCdc7tDkZG0NTrCgoUrN6s&sz=w1600', 'https://drive.google.com/thumbnail?id=1fqYxZtkrWYdH8W2-d1Jz1z54Tj1y3WQO&sz=w1600', 'https://drive.google.com/thumbnail?id=1vJClwgxDbsX9pC3ERB8OS_iybPbp53FC&sz=w1600', 'https://drive.google.com/thumbnail?id=1cB-th3IVz2Uk7hIAolqdwNRWOOCaZUs_&sz=w1600', 'https://drive.google.com/thumbnail?id=1bswYZwJcm68U9ViFlF-FfQnFsbcE9Xpt&sz=w1600', 'https://drive.google.com/thumbnail?id=1lE_w3Tr8ArBErkPoob_UYtfmSUYdDcqy&sz=w1600', 'https://drive.google.com/thumbnail?id=1ix1ur4m_4K0YBSUSoZ7je7aUusGuKz_9&sz=w1600', 'https://drive.google.com/thumbnail?id=178jYGDwTJeGf5uuffo-ZStcJ6hywphZE&sz=w1600', 'https://drive.google.com/thumbnail?id=1-u14H8kyXzqlPvxwizLSfHRpe_0ZioWA&sz=w1600', 'https://drive.google.com/thumbnail?id=1GglejK-5Y4fm1nqO4GIj2LK-wYH_sNyu&sz=w1600', 'https://drive.google.com/thumbnail?id=1h-eCeVANBinsCln5JCE22Uj0b5FNocBr&sz=w1600', 'https://drive.google.com/thumbnail?id=1Cr9ZPZnpg3IWq7_RwWboyUypo6dRYgJi&sz=w1600', 'https://drive.google.com/thumbnail?id=1SmdjIFtsdlKJkWfNUq11FlzqRHM4c0ao&sz=w1600', 'https://drive.google.com/thumbnail?id=1hBAEuZRuL76TQ98t9ZXKvRDYYCnEVR_m&sz=w1600', 'https://drive.google.com/thumbnail?id=13alOu7BGvVGicXlqFUoBvl75jWxK_WYe&sz=w1600', 'https://drive.google.com/thumbnail?id=1oSazNvZuLnHLJzDD4F9SdE93-hFEB8vF&sz=w1600', 'https://drive.google.com/thumbnail?id=1uQesXDNrYz8bIxh_s4L8rkKv04F2uVgQ&sz=w1600'],
    fotosTxt: ['Imagen del proyecto', 'Render', 'Render', 'Render', 'Render', 'Render', 'Render', 'Render', 'Render', 'Render', 'Render', 'Render', 'Render', 'Render', 'Render', 'Render', 'Render', 'Render', 'Render', 'Render', 'Render', 'Render', 'Render', 'Render', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Avance de obra', 'Avance de obra', 'Avance de obra', 'Avance de obra', 'Avance de obra', 'Avance de obra'],
    fuentes: []
  },
  {
    name: 'Edificio Ykua Satí', dev: AQ_PROPIA, tipo: 'Departamento', etapa: 'Próximamente',
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
    fuentes: []
  },
  {
    name: 'Dúplex Lambaré', dev: AQ_PROPIA, tipo: 'Casa', etapa: 'Entregado',
    barrio: 'Lambaré', ciudad: 'Lambaré',
    precio: null, entrega: null,
    tipologia: 'Dúplex de 3 dormitorios', dmin: 3, dmax: 3,
    facts: [['Viviendas', '2'], ['Superficie', '180 m²'], ['Plantas', 'Planta baja y planta alta']],
    amen: ['Garaje', 'Cocina', 'Salón comedor', 'Zona de barbacoa', 'Piscina opcional'],
    pagos: 'Consultar condiciones con la desarrolladora.',
    nota: 'Proyecto finalizado: dos viviendas dúplex, cómodas y funcionales, pensadas para familias.',
    fotosReales: true,
    fotos: ['https://grupoeras.com.ar/wp-content/uploads/2024/04/lambare-hero.jpg', 'https://grupoeras.com.ar/wp-content/uploads/2026/06/C0143.00_00_00_00.Imagen-fija017-1024x576.png', 'https://drive.google.com/thumbnail?id=1n8yenBM6583_vL123l6_C1smxYECaxrr&sz=w1600', 'https://drive.google.com/thumbnail?id=1_-6H4wl-iH45UratxwJlyFGsn6iUKDcy&sz=w1600', 'https://drive.google.com/thumbnail?id=1F_pCArI59lhNuMpFFTwnHnGrn3-c3U_1&sz=w1600', 'https://drive.google.com/thumbnail?id=1sSYQFqBAvew7O5p3xZeRUgXLZxXhVU-s&sz=w1600', 'https://drive.google.com/thumbnail?id=15Fh1z_rjSUtu9UfIWyj38Hh3twoCChNQ&sz=w1600', 'https://drive.google.com/thumbnail?id=18mQCfsr9Q9U3Aswba0oGlJUWblVcQ9R_&sz=w1600', 'https://drive.google.com/thumbnail?id=1Mhfu9wP6QQfnoWfb2St5F-dH_0435oGh&sz=w1600', 'https://drive.google.com/thumbnail?id=1qldr7Gj85jpHHBdmm6RrOR-AK1WT0FSo&sz=w1600', 'https://drive.google.com/thumbnail?id=1Fs3a1qi_xPaHXbe-SXjuQy92lMTXdLhz&sz=w1600', 'https://drive.google.com/thumbnail?id=1Y1n1zGKRz_6v8ehJjOzAusJFDNu0Tyq-&sz=w1600', 'https://drive.google.com/thumbnail?id=1gY7Om2XVOFb2LYeR6uovMtcQlCiCC-lO&sz=w1600', 'https://drive.google.com/thumbnail?id=1lJMOHmFgjE_mhYalCaCjJsV4V99ZyK3U&sz=w1600', 'https://drive.google.com/thumbnail?id=1-G83Ab8yUIz65jQUp1MAmbkO-VW_HYAR&sz=w1600', 'https://drive.google.com/thumbnail?id=1Itt9FwatH8vP_2os6O1JvV_zNGbhUv7g&sz=w1600', 'https://drive.google.com/thumbnail?id=1k65igiRKeSbPOLjfvbYXnq5_9lfD05uF&sz=w1600', 'https://drive.google.com/thumbnail?id=1783zLneTY_QAIdl19Yvdf2pUMPrxqSP1&sz=w1600', 'https://drive.google.com/thumbnail?id=10moMn5LCunIXnFSCA3OF-aa1ZzbYRktU&sz=w1600', 'https://drive.google.com/thumbnail?id=1GofuW9zy-drFOgz44ZSuRifpgfMMPAkw&sz=w1600', 'https://drive.google.com/thumbnail?id=1cC5fVyJF-f2UpU1MMKP3uJbyFgtHlujP&sz=w1600', 'https://drive.google.com/thumbnail?id=1QD_9Ohf9O_FGFVAIrtfDgjgt3FIrlsyO&sz=w1600', 'https://drive.google.com/thumbnail?id=1ZDZxS7uBNA3LerVJhdC8_qpylu5X36JN&sz=w1600', 'https://drive.google.com/thumbnail?id=1fFFLCZxcO2CCIqSU_i5DRVu_-rJJc39d&sz=w1600', 'https://drive.google.com/thumbnail?id=1oGJ42oDkCWvJOvRuKBzW-gyOc00VGpTm&sz=w1600', 'https://drive.google.com/thumbnail?id=1QOtBMVssDZwKT8sA0CLb_hqRQz9Y1rw6&sz=w1600', 'https://drive.google.com/thumbnail?id=1qFrnwNRskvXAy_yh5udKw63HCvICH3Cv&sz=w1600', 'https://drive.google.com/thumbnail?id=1Lb2FSnNQVuR-60mH2Ym4M2qAAxKRJUTH&sz=w1600', 'https://drive.google.com/thumbnail?id=1RUgWrbhDBcJIofICFhKIX_Zky22RQZAl&sz=w1600', 'https://drive.google.com/thumbnail?id=1HRQJHCUL0_ZBZfbv0nJsHAxMKJmfQHyh&sz=w1600', 'https://drive.google.com/thumbnail?id=1rmp_p2U75_UagEeYC7IfxfenIIseCWEH&sz=w1600', 'https://drive.google.com/thumbnail?id=1-HYBWferd3QY3z471oQj1_3-M2ksHbZK&sz=w1600', 'https://drive.google.com/thumbnail?id=1W9mLTQ2hnCvb20HU4_Gyv2EAUWOmpMEM&sz=w1600', 'https://drive.google.com/thumbnail?id=1derTwaPQuSYa1DUYbiTwortFjHD7_2aV&sz=w1600', 'https://drive.google.com/thumbnail?id=1H-Y4jvgJSuNtM00b9L5BHKF7vgG6OzXa&sz=w1600', 'https://drive.google.com/thumbnail?id=1SH_SlNhdf4l0NuyaJZ7-_vrIvzM5ERPk&sz=w1600', 'https://drive.google.com/thumbnail?id=1jKq0CTVhhIyZwUFbRt0-mIfkFbk9eOvz&sz=w1600'],
    fotosTxt: ['Imagen del proyecto', 'Imagen del proyecto', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real', 'Foto real'],
    fuentes: []
  },
  {
    name: 'Dúplex Luque', dev: AQ_PROPIA, tipo: 'Casa', etapa: 'Entregado',
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
    fuentes: []
  }
];
