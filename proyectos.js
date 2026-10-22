// Catálogo compartido por las páginas Proyectos y Ficha.
// Por ahora son proyectos reales de otras desarrolladoras, con fuente y fecha del dato.
// Cuando haya proyectos propios, se agregan aquí con dev: window.MARCA.nombre.
// precio: USD publicado hoy en la fuente, o null para "Consultar precio".
// precioFiltro: USD aproximado solo para el filtro de inversión.
// precioPyg: precio publicado en guaraníes (se convierte con el selector de moneda).
// precioPub: último precio publicado cuando no hay uno vigente (USD, con su fecha); se muestra como referencia.
// fotos: imágenes de referencia del tipo de propiedad (Unsplash), no del proyecto. Para usar fotos reales,
//   cambia estas URL por las propias (p. ej. '/img/aires-pacheco-1.jpg').
// mapa: dirección o lugar para Google Maps; sin mapa cuando no hay ubicación exacta publicada.
window.PROYECTOS = [
  {
    name: 'Aires Pacheco', mapa: 'Aires Pacheco, Asunción, Paraguay', dev: 'Realpy Desarrollos', tipo: 'Departamento', etapa: 'En pozo',
    barrio: 'Mariscal', ciudad: 'Asunción',
    precio: 48356, entrega: '2.º semestre 2029',
    tipologia: 'Monoambiente a 2 dormitorios', dmin: 0, dmax: 2,
    facts: [['Niveles', '21'], ['Unidades', '136'], ['Tipologías', 'Monoambiente, 1 y 2 dorm.'], ['Entrega', '2.º semestre 2029']],
    amen: ['Piscina', 'Gimnasio', 'Spa y sauna', 'Coworking y salas de reunión', 'Sala de cine', 'Quinchos', 'Lavandería'],
    pagos: 'Consultar condiciones con la desarrolladora.',
    nota: 'A pocas cuadras de Shopping Mariscal, con acceso a las avenidas Mariscal López, España y San Martín.',
    fotos: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1400&q=70', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1400&q=70', 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1400&q=70'],
    fuentes: [
      { nombre: 'InfoCasas', url: 'https://www.infocasas.com.py/proyectos/aires-pacheco', fecha: 'consultado en oct. 2026' }
    ]
  },
  {
    name: 'First Mariscal', mapa: 'Quesada y Teniente Zotti, Asunción, Paraguay', dev: null, tipo: 'Departamento', etapa: 'A confirmar',
    barrio: 'Mariscal', ciudad: 'Asunción',
    precio: null, precioFiltro: 70720, entrega: 'Prevista para marzo de 2027',
    tipologia: '1 a 3 dormitorios', dmin: 1, dmax: 3,
    facts: [['Construcción', 'Benítez Bittar'], ['Comercialización', 'Era Black Paraguay'], ['Superficie total', '19.000 m²'], ['Precio publicado en oct. 2023', '1 dorm. desde USD 70.720']],
    amen: ['Cochera incluida en cada unidad'],
    pagos: 'Consultar condiciones con la comercializadora.',
    nota: 'Frente a la torre B de Shopping Mariscal (Quesada y Tte. Zotti). La obra estaba prevista de marzo de 2024 a marzo de 2027.',
    fotos: ['https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=70', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=70', 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1400&q=70'],
    fuentes: [
      { nombre: 'Infonegocios', url: 'https://infonegocios.com.py/infomicasa/atencion-inversores-cinco-departamentos-en-villa-morra-por-menos-de-us-200-000', fecha: 'oct. 2023' }
    ]
  },
  {
    name: 'Urban Carmelitas', mapa: 'Urban Carmelitas, Las Carmelitas, Asunción, Paraguay', dev: null, tipo: 'Departamento', etapa: 'Entregado',
    barrio: 'Las Carmelitas', ciudad: 'Asunción',
    precio: 74000, entrega: 'Entregado en 2021',
    tipologia: '1 y 2 dormitorios', dmin: 1, dmax: 2,
    facts: [['Pisos', '7'], ['Unidades', '70'], ['1 dormitorio', '48 m²'], ['2 dormitorios', '72 y 82 m²']],
    amen: ['Piscina de 23 m en la azotea', 'Quinchos panorámicos', 'Gimnasio', 'Seguridad 24 h', 'Generador', 'Unidades semiamuebladas'],
    pagos: 'Plan a medida según ingresos, a consultar.',
    nota: null,
    fotos: ['https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1400&q=70', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=70', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1400&q=70'],
    fuentes: [
      { nombre: 'InfoCasas', url: 'https://www.infocasas.com.py/proyectos/urban-carmelitas', fecha: 'consultado en oct. 2026' }
    ]
  },
  {
    name: 'Highlands', mapa: 'Highlands, San Bernardino, Paraguay', dev: null, tipo: 'Barrio cerrado', tambien: ['Casa', 'Lote'], etapa: 'En venta',
    barrio: 'Ruta 2', ciudad: 'San Bernardino',
    precio: null, precioFiltro: 74304, precioPub: { usd: 74304, pre: 'Lotes desde ', fecha: 'ene. 2025' }, entrega: null,
    tipologia: 'Lotes, townhouses y departamentos',
    facts: [['Superficie', '90 ha'], ['Lotes', '469, desde 576 m²'], ['Townhouses', '75'], ['Precios publicados en ene. 2025', 'Lotes desde USD 74.304; townhouses desde USD 209.500']],
    amen: ['Laguna Crystal Lagoons', '17 ha de áreas verdes', 'Dos club houses', 'Gimnasio', 'Paseo comercial'],
    pagos: 'En enero de 2025: 20 % de entrada y hasta 60 cuotas para los lotes.',
    nota: 'Arquitectura de Gould Arquitectura.',
    fotos: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1400&q=70', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1400&q=70', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=70'],
    fuentes: [
      { nombre: 'Infonegocios', url: 'https://infonegocios.com.py/infomicasa/highlands-el-barrio-cerrado-que-rompio-records-de-venta-en-san-bernardino-con-170-lotes-comercializados', fecha: 'ene. 2025' }
    ]
  },
  {
    name: 'Madre Selva', mapa: 'Madre Selva, San Bernardino, Paraguay', dev: 'Rodrigo Pena y Cristian Valente', tipo: 'Barrio cerrado', tambien: ['Lote'], etapa: 'En venta',
    barrio: 'Ciervo Cuá', ciudad: 'San Bernardino',
    precio: null, precioFiltro: 60000, precioPub: { usd: 60, hasta: 95, suf: ' por m²', fecha: 'sep. 2024' }, entrega: null,
    tipologia: 'Lotes de más de 1.000 m²',
    facts: [['Superficie', '10 ha'], ['Lotes', '67, de más de 1.000 m²'], ['Precio publicado en sep. 2024', 'USD 60–95 por m²']],
    amen: ['Club house de 600 m²', 'Piscinas', 'Gimnasio, sauna y jacuzzi', 'Canchas', 'Caballerizas', 'Reserva natural', 'Servicios subterráneos'],
    pagos: 'En septiembre de 2024: hasta 24 cuotas sin interés o 60 cuotas al 8 % anual.',
    nota: 'Con vista al lago Ypacaraí.',
    fotos: ['https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1400&q=70', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1400&q=70', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=70'],
    fuentes: [
      { nombre: 'Forbes Paraguay', url: 'https://www.forbes.com.py/negocios/con-una-inversion-us-4-millones-nace-san-bernadino-barrio-cerrado-madre-selva-n60060', fecha: 'sep. 2024' }
    ]
  },
  {
    name: 'Paraná Country Club', mapa: 'Paraná Country Club, Hernandarias, Paraguay', dev: null, tipo: 'Country', tambien: ['Casa', 'Lote'], etapa: 'En venta',
    barrio: 'Paraná Country Club', ciudad: 'Hernandarias',
    precio: 210000, entrega: null,
    tipologia: 'Lotes y casas',
    facts: [['Lote publicado', 'USD 210.000'], ['Casas publicadas', 'USD 550.000 – 680.000'], ['Casas', '1.100 – 2.384 m² de terreno']],
    amen: ['Áreas verdes', 'Amenities de club'],
    pagos: 'Contado; condiciones según cada vendedor.',
    nota: 'Precios de avisos publicados, no de ventas cerradas.',
    fotos: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1400&q=70', 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1400&q=70', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1400&q=70'],
    fuentes: [
      { nombre: 'ViaParaguay', url: 'https://viaparaguay.com/es/zona/hernandarias-parana-country-club', fecha: '2026' }
    ]
  },
  {
    name: 'Urbanización Itauguá', dev: 'IRÚN Inmobiliaria', tipo: 'Lote', etapa: 'En venta',
    barrio: 'Itauguá', ciudad: 'Itauguá',
    precio: null, precioTxt: 'G. 40.000.000', precioPyg: 40000000, precioFiltro: 6700, entrega: null,
    tipologia: 'Lotes desde 360 m²',
    facts: [['Lotes', 'Desde 360 m²'], ['Contado', 'Desde G. 40.000.000'], ['Entrega inicial', 'Desde G. 8.000.000'], ['Cuotas', 'Desde G. 860.450']],
    amen: ['Energía eléctrica', 'Agua potable', 'Transporte público'],
    pagos: 'Entrega desde G. 8.000.000 y cuotas desde G. 860.450.',
    nota: 'Cerca de la ruta Itauguá–Pirayú.',
    fotos: ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1400&q=70', 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1400&q=70', 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1400&q=70'],
    fuentes: [
      { nombre: 'IRÚN Inmobiliaria', url: 'https://www.iruninmobiliaria.com.py/loteamientos/itaugua/', fecha: 'consultado en oct. 2026' }
    ]
  }
];
