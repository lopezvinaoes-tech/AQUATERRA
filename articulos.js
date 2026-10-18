// Artículos del blog. Cada dato sale de una fuente pública enlazada en "fuentes".
// Bloques del cuerpo: h2 (subtítulo), p (párrafo), list (viñetas), dato (cifra destacada),
// tabla (cabecera + filas). Para añadir un artículo, copia uno y cambia el slug.
window.ARTICULOS = [
  {
    slug: 'comprar-en-pozo-o-terminado',
    cat: 'Guías',
    t: 'Comprar sobre plano o terminado en Asunción: qué dicen los números',
    ex: 'En Asunción, el piso en pozo cuesta en lista solo un 1,9 % menos que el terminado. La ventaja real está en cómo se paga, no en el precio.',
    fecha: 'Octubre 2026',
    portada: { cifra: '1,9 %', pie: 'menos cuesta el m² en pozo que el terminado, en precio de lista' },
    cuerpo: [
      { t: 'p', x: 'Una de las ideas que más se repiten al hablar de Paraguay es que comprar en pozo (lo que en España llamamos sobre plano) sale mucho más barato que comprar un piso terminado. Los datos publicados en 2026 matizan bastante esa promesa, y conviene conocerlos antes de decidir.' },
      { t: 'h2', x: 'La diferencia de precio es pequeña' },
      { t: 'p', x: 'Keypy analizó 4.417 anuncios de Asunción en mayo de 2026. El metro cuadrado en pozo se publicaba de media a USD 1.783, frente a USD 1.817 en los pisos de entrega inmediata. Es decir, una diferencia de apenas el 1,9 % en precio de lista.' },
      { t: 'dato', v: '1,9 %', x: 'USD 1.783/m² en pozo frente a USD 1.817/m² terminado, sobre 4.417 anuncios de Asunción (mayo de 2026).', f: { nombre: 'Keypy', url: 'https://www.key-py.com/investigaciones/pozo-vs-entrega-inmediata-asuncion-mayo-2026' } },
      { t: 'p', x: 'Hay un matiz importante: los anuncios no recogen los precios de lanzamiento ni los descuentos por pago anticipado, que se negocian proyecto a proyecto. Ese descuento existe, pero hay que pedírselo a cada promotor por escrito; no se puede dar por hecho.' },
      { t: 'h2', x: 'El coste oculto: la renta que no cobras' },
      { t: 'p', x: 'Mientras dura la obra, el piso no se puede alquilar. Con una renta bruta de referencia del 7,4 %, cada año de obra equivale a dejar de ingresar alrededor del 7 % del valor del inmueble, según el análisis de HolaCasa con datos de Numbeo. En una obra de dos o tres años, esa renta perdida puede pesar más que el descuento de entrada.' },
      { t: 'h2', x: 'Entonces, ¿por qué comprar en pozo?' },
      { t: 'p', x: 'Porque la ventaja real del pozo es la forma de pago. En lugar de desembolsar todo el importe de golpe o depender de un banco, el pago se reparte durante la obra:' },
      { t: 'list', items: [
        'Una reserva inicial, que con promotores suele estar entre USD 1.000 y 5.000.',
        'Un anticipo y cuotas mensuales directamente al promotor mientras se construye.',
        'Un saldo a la entrega de llaves.'
      ] },
      { t: 'p', x: 'Para quien invierte desde España esto es clave: el crédito hipotecario en Paraguay suele exigir residencia, así que para un no residente lo realista es comprar al contado o con cuotas del promotor.' },
      { t: 'h2', x: 'Qué revisar antes de firmar' },
      { t: 'p', x: 'El principal riesgo del pozo es el retraso o la quiebra del promotor. Por eso conviene comprobar:' },
      { t: 'list', items: [
        'La trayectoria del promotor: qué obras ha entregado y con qué plazos.',
        'Si existe fideicomiso u otra garantía sobre lo que vas pagando.',
        'El plazo de entrega comprometido en el contrato y qué pasa si se incumple.',
        'Que cada pago tenga su recibo y que la reserva esté respaldada por un contrato.'
      ] },
      { t: 'p', x: 'Un dato que juega a tu favor: según el artículo 782 del Código Civil paraguayo, en una compraventa a plazos, una vez pagado el 25 % del precio el vendedor, en principio, ya no puede rescindir el contrato y quedarse con lo pagado.' },
      { t: 'h2', x: 'En resumen' },
      { t: 'p', x: 'Comprar en pozo no es comprar mucho más barato: es comprar con un calendario de pagos más cómodo, a cambio de esperar y de asumir el riesgo de obra. Compara siempre la cuota durante la obra con la renta que dejarías de cobrar, y negocia el descuento de lanzamiento con cada promotor.' }
    ],
    fuentes: [
      { nombre: 'Keypy: pozo vs. entrega inmediata en Asunción (mayo de 2026)', url: 'https://www.key-py.com/investigaciones/pozo-vs-entrega-inmediata-asuncion-mayo-2026' },
      { nombre: 'HolaCasa: comprar en pozo vs. terminado en Paraguay', url: 'https://holacasa.com.py/comprar-en-pozo-vs-terminado-paraguay/' },
      { nombre: 'Rio Times: comprar propiedad en Paraguay siendo extranjero (2026)', url: 'https://www.riotimesonline.com/buying-property-paraguay-foreigners-2026/' },
      { nombre: 'UbicaProp: créditos hipotecarios en Paraguay', url: 'https://ubicaprop.com.py/creditos-hipotecarios-paraguay-bancos-tasas/' },
      { nombre: 'Infonegocios Legal: rescisión tras pagar el 25 %', url: 'https://infonegocios.com.py/infolegal/se-puede-resolver-un-contrato-de-compraventa-de-inmueble-despues-de-pagar-el-25' }
    ]
  },
  {
    slug: 'impuestos-invertir-paraguay-desde-espana',
    cat: 'Impuestos',
    t: 'Impuestos al invertir en Paraguay desde España',
    ex: 'IVA del 5 %, IRP del 8 % y sin impuesto al patrimonio. Pero si sigues siendo residente fiscal en España, Hacienda también cuenta. Te lo explicamos.',
    fecha: 'Octubre 2026',
    portada: { cifra: 'IVA 5 %', pie: 'en la compra y el alquiler de vivienda en Paraguay' },
    cuerpo: [
      { t: 'p', x: 'Paraguay tiene fama de país con impuestos bajos, y en el sector inmobiliario es cierto. Pero para un inversor español la pregunta importante no es solo cuánto se paga en Paraguay, sino dónde tienes tu residencia fiscal. Eso cambia los números.' },
      { t: 'h2', x: 'Lo que se paga en Paraguay' },
      { t: 'tabla', cab: ['Impuesto', 'Cuánto', 'Cuándo'], filas: [
        ['Gastos de transferencia (escribano, registro, tasas)', 'Normalmente no más del 3 % del valor escriturado', 'Una vez, al escriturar'],
        ['Impuesto inmobiliario', '1 % del valor fiscal, muy inferior al de mercado (reajustado un 4,1 % para 2026)', 'Cada año'],
        ['IVA', '5 % en compra y alquiler de vivienda; 10 % en alquiler comercial', 'En cada venta o factura de alquiler'],
        ['IRP sobre alquileres', '8 % sobre una renta presunta del 50 % del alquiler (o sobre la renta real)', 'Cada año'],
        ['IRP al vender', '8 % sobre una ganancia presunta del 30 % del precio; lo retiene el escribano', 'Al vender'],
        ['Patrimonio', 'No existe impuesto al patrimonio', '—']
      ] },
      { t: 'p', x: 'Si inviertes a través de una sociedad, en lugar del IRP se aplican el IRE (10 %) y el IDU sobre dividendos (8 % para residentes y 15 % para no residentes).' },
      { t: 'dato', v: '4 %', x: 'Es el tipo efectivo del IRP sobre el alquiler: un 8 % aplicado sobre el 50 % de lo cobrado. Solo es el impuesto final si tu residencia fiscal está en Paraguay.', f: { nombre: 'Yo Facturo', url: 'https://yo-facturo.com/blog/irp-paraguay-impuesto-renta-personal/' } },
      { t: 'h2', x: 'Si sigues siendo residente fiscal en España' },
      { t: 'p', x: 'Hacienda grava tu renta mundial. El alquiler que cobres en Asunción se declara en el IRPF como rendimiento del capital inmobiliario, y si el piso no está alquilado se imputa una renta presunta.' },
      { t: 'p', x: 'Además, si el valor de tus inmuebles en el extranjero supera los 50.000 €, tienes que presentar el Modelo 720 entre enero y marzo.' },
      { t: 'h2', x: 'El convenio de doble imposición' },
      { t: 'p', x: 'España y Paraguay firmaron en 2023 un convenio para evitar la doble imposición, publicado en el BOE el 29 de julio de 2024. En la práctica, lo que pagues en Paraguay se descuenta de lo que debes en España, hasta el límite del impuesto español. No pagas dos veces por la misma renta, pero tampoco te quedas en el 4 % paraguayo si tributas en España.' },
      { t: 'h2', x: 'Si te haces residente fiscal en Paraguay' },
      { t: 'p', x: 'En ese caso tributas solo por la renta de fuente paraguaya: el 8 % sobre el 50 % del alquiler, un 4 % efectivo. Es el argumento que más se usa en el sector, pero solo se aplica a quien deja de ser residente fiscal en España.' },
      { t: 'h2', x: 'Nuestra recomendación' },
      { t: 'list', items: [
        'Haz los números con el impuesto que realmente te corresponde según tu residencia, no con el más bajo.',
        'Ten en cuenta el Modelo 720 si superas el umbral de 50.000 €.',
        'Valida el cálculo final con un asesor fiscal: cada situación personal es distinta.'
      ] }
    ],
    fuentes: [
      { nombre: 'Infonegocios Legal: invertir en departamentos en Paraguay', url: 'https://infonegocios.com.py/infolegal/invertir-en-departamentos-en-paraguay-introduccion-general-para-el-inversionista' },
      { nombre: 'Última Hora: reajuste del 4,1 % del impuesto inmobiliario 2026', url: 'https://www.ultimahora.com/santiago-pena-decreta-reajuste-del-4-1-para-el-impuesto-inmobiliario-del-2026' },
      { nombre: 'Última Hora: 5 ventajas impositivas para inversionistas', url: 'https://www.ultimahora.com/paraguay-ofrece-5-ventajas-impositivas-a-inversionistas' },
      { nombre: 'Yo Facturo: IRP en Paraguay', url: 'https://yo-facturo.com/blog/irp-paraguay-impuesto-renta-personal/' },
      { nombre: 'TaxDown: rentas de vivienda en el extranjero', url: 'https://taxdown.es/extranjeros/rentas-vivienda-extranjero' },
      { nombre: 'Ferrere: España ratifica el convenio con Paraguay', url: 'https://ferrere.com/es/novedades/espana-ratifica-convenio-con-paraguay-para-evitar-la-doble-imposicion/' },
      { nombre: 'Fiscal Impuestos: nuevo convenio España–Paraguay', url: 'https://www.fiscal-impuestos.com/nuevo-convenio-espana-paraguay-evitar-doble-imposicion-prevenir-elusion-evasion-fiscales' }
    ]
  },
  {
    slug: 'comprar-en-paraguay-desde-espana-sin-residencia',
    cat: 'Legal',
    t: 'Cómo comprar un piso en Paraguay desde España, sin residencia y sin viajar',
    ex: 'Basta el pasaporte y, si no puedes viajar, un poder notarial. Te contamos el proceso paso a paso, los plazos y lo que debe revisar tu escribano.',
    fecha: 'Octubre 2026',
    portada: { cifra: '60–120', pie: 'días tarda el proceso completo, de la reserva a la inscripción' },
    cuerpo: [
      { t: 'p', x: 'Un extranjero puede comprar un inmueble en Paraguay a su nombre, sin residencia y sin crear una sociedad local. El documento que necesitas es tu pasaporte. Y si no puedes viajar, la firma se puede hacer mediante un poder notarial.' },
      { t: 'h2', x: 'El proceso, paso a paso' },
      { t: 'list', items: [
        'Reserva. En reventas suele ser del 10 al 20 % del precio; con promotores, entre USD 1.000 y 5.000.',
        'Revisión del título. El escribano (conviene que sea uno propio, no el del vendedor) revisa 30 años de historia del título, embargos, hipotecas, deudas municipales y expensas, y pide el Certificado Catastral-Registral.',
        'Firma de la escritura pública ante escribano, en persona o con poder notarial.',
        'Inscripción en la Dirección General de los Registros Públicos. Solo a partir de aquí la propiedad es plenamente tuya.'
      ] },
      { t: 'dato', v: '60–120 días', x: 'Es lo que suele durar el proceso completo, desde la reserva hasta la inscripción en el registro.', f: { nombre: 'Rio Times', url: 'https://www.riotimesonline.com/buying-property-paraguay-foreigners-2026/' } },
      { t: 'h2', x: 'Trámites que te pedirán' },
      { t: 'list', items: [
        'RUC: el escribano puede tramitarte durante la compra un número tributario de no residente.',
        'Origen de los fondos: tendrás que justificar de dónde procede el dinero, por la normativa de prevención de blanqueo (SEPRELAD).',
        'Gastos de transferencia: escribano, registro y tasas no suelen superar el 3 % del valor escriturado.'
      ] },
      { t: 'h2', x: '¿Hay restricciones para extranjeros?' },
      { t: 'p', x: 'Solo en suelo rural. La franja de 50 km junto a la frontera está vedada a los nacionales de países limítrofes (Ley 2532/05) y las tierras de reforma agraria del INDERT tienen bloqueada la transferencia. Para un piso en Asunción, nada de esto te afecta.' },
      { t: 'h2', x: '¿Y la financiación?' },
      { t: 'p', x: 'Los créditos hipotecarios en Paraguay son mayoritariamente en guaraníes y en general exigen residencia. Para un comprador no residente, lo realista es pagar al contado o con las cuotas que ofrece el promotor durante la obra.' },
      { t: 'h2', x: 'Residencia por inversión: el Investor Pass' },
      { t: 'p', x: 'En abril de 2026 el Gobierno lanzó el Investor Pass, una vía acelerada a la residencia permanente. Según la Resolución 0283/2026, la vía inmobiliaria exige USD 200.000 invertidos, con escritura o con contrato y al menos el 30 % pagado, y no cuenta la vivienda de uso propio. Con tickets de USD 50.000 a 100.000 no se llega, pero no hace falta residencia para comprar.' },
      { t: 'h2', x: 'Señales de alarma' },
      { t: 'p', x: 'Desconfía de reservas sin contrato, anticipos sin recibo, inmuebles sin regularizar y edificios cuyo reglamento prohíbe el alquiler temporal si piensas alquilar así. Un buen escribano propio y un proceso transparente valen más que cualquier descuento.' }
    ],
    fuentes: [
      { nombre: 'Rio Times: comprar propiedad en Paraguay siendo extranjero (2026)', url: 'https://www.riotimesonline.com/buying-property-paraguay-foreigners-2026/' },
      { nombre: 'Infonegocios Legal: invertir en departamentos en Paraguay', url: 'https://infonegocios.com.py/infolegal/invertir-en-departamentos-en-paraguay-introduccion-general-para-el-inversionista' },
      { nombre: 'UbicaProp: créditos hipotecarios en Paraguay', url: 'https://ubicaprop.com.py/creditos-hipotecarios-paraguay-bancos-tasas/' },
      { nombre: 'ABC: Investor Pass, residencia permanente para inversores', url: 'https://www.abc.com.py/economia/2026/05/21/investor-pass-residencia-permanente-en-paraguay-para-inversores-extranjeros/' },
      { nombre: 'IMI Daily: la letra pequeña del Investor Pass', url: 'https://www.imidaily.com/latin-america/paraguays-investor-pass-the-fine-print-is-in-and-its-more-generous-than-expected/' }
    ]
  },
  {
    slug: 'rentabilidad-alquiler-asuncion',
    cat: 'Mercado',
    t: 'Rentabilidad del alquiler en Asunción: qué esperar de verdad',
    ex: 'Entre un 6 y un 8 % neto anual en dólares para un piso bien situado. Por qué desconfiar de las cifras del 20 % y cómo hacer tus propias cuentas.',
    fecha: 'Octubre 2026',
    portada: { cifra: '6–8 %', pie: 'de rentabilidad neta anual en dólares, alquiler tradicional' },
    cuerpo: [
      { t: 'p', x: 'Un piso bien ubicado en Asunción rinde entre un 6 y un 9 % bruto anual en dólares, frente al 5,5 a 6,5 % de Uruguay, según La Nación. Descontados los gastos, Infonegocios Legal sitúa la rentabilidad neta entre el 6 y el 8 %. Es una cifra prudente y con fuente, y es la que usamos para hacer números.' },
      { t: 'dato', v: '6–8 %', x: 'Rentabilidad neta anual en dólares de un piso en alquiler tradicional en Asunción.', f: { nombre: 'Infonegocios Legal', url: 'https://infonegocios.com.py/infolegal/invertir-en-departamentos-en-paraguay-introduccion-general-para-el-inversionista' } },
      { t: 'h2', x: 'Hay demanda de alquiler' },
      { t: 'p', x: 'Según InfoCasas (enero a abril de 2026), el 70 % de la demanda inmobiliaria del país se concentra en Asunción y el 53 % de las búsquedas son de alquiler. El inversor típico compra pisos de 1 y 2 dormitorios de entre USD 55.000 y 95.000.' },
      { t: 'h2', x: 'Según la estrategia' },
      { t: 'tabla', cab: ['Estrategia', 'Rendimiento de referencia', 'Riesgo principal'], filas: [
        ['Alquiler tradicional (contrato anual)', '6–8 % anual en USD', 'Vacancia, inquilino moroso'],
        ['Alquiler temporal (Airbnb, ejecutivos)', 'Hasta 9 % o más, con más gestión', 'El reglamento del edificio puede prohibirlo'],
        ['Compra en pozo para revender', 'Diferencia entre precio de pozo y de entrega', 'Retraso o quiebra del promotor']
      ] },
      { t: 'h2', x: '¿Y las cifras más altas que circulan?' },
      { t: 'p', x: 'TuLugar calcula una renta bruta nacional del 10,1 % para pisos y una mediana de alquiler de USD 1.051 al mes en Asunción. Es más alta porque se basa en precios anunciados y no descuenta gastos ni periodos sin inquilino. Si ves promesas del 20 % o más, compáralas con estas cifras de mercado publicadas y pregunta de dónde salen.' },
      { t: 'h2', x: 'Un ejemplo de cálculo' },
      { t: 'p', x: 'Un piso de USD 80.000 alquilado al 7 % bruto genera USD 5.600 al año, unos USD 467 al mes. A eso hay que restarle:' },
      { t: 'list', items: [
        'Las expensas (gastos de comunidad), si las paga el propietario.',
        'Algún mes sin inquilino entre contratos.',
        'Los impuestos: en Paraguay, el IRP es del 8 % sobre el 50 % del alquiler (un 4 % efectivo); si eres residente fiscal en España, además declaras la renta en el IRPF.'
      ] },
      { t: 'p', x: 'Es un ejemplo para entender el orden de magnitud, no una promesa de rentabilidad.' },
      { t: 'h2', x: 'El tipo de cambio también cuenta' },
      { t: 'p', x: 'Piensas en euros, el mercado cotiza en dólares y el alquiler puede cobrarse en dólares o en guaraníes. En 2026 el guaraní se apreció un 10,5 % frente al dólar (de G. 6.228 en enero a G. 5.962 el 3 de agosto). Los movimientos de divisa pueden sumar o restar a tu rentabilidad final.' }
    ],
    fuentes: [
      { nombre: 'La Nación: el mercado paraguayo, uno de los más atractivos de la región', url: 'https://www.lanacion.com.py/negocios/2025/08/12/mercado-inmobiliario-paraguayo-se-consolida-como-uno-de-los-mas-atractivos-de-la-region/' },
      { nombre: 'Infonegocios Legal: invertir en departamentos en Paraguay', url: 'https://infonegocios.com.py/infolegal/invertir-en-departamentos-en-paraguay-introduccion-general-para-el-inversionista' },
      { nombre: 'Última Hora: crece el interés por viviendas (InfoCasas, ene–abr 2026)', url: 'https://www.ultimahora.com/crece-interes-por-viviendas-pero-persisten-desafios-para-el-credito' },
      { nombre: 'TuLugar: informe de mercado, agosto de 2026', url: 'https://tulugar.com/en/informes/paraguay/2026-08' },
      { nombre: 'Yo Facturo: IRP en Paraguay', url: 'https://yo-facturo.com/blog/irp-paraguay-impuesto-renta-personal/' },
      { nombre: 'Infobae/EFE: el guaraní se aprecia más de un 10 % en 2026', url: 'https://www.infobae.com/america/agencias/2026/08/03/la-moneda-paraguaya-se-aprecia-mas-de-un-10-frente-al-dolar-en-lo-que-va-de-2026/' }
    ]
  },
  {
    slug: 'zonas-asuncion-donde-invertir',
    cat: 'Mercado',
    t: 'Dónde invertir en Asunción: zonas, precios por m² y renta comercial',
    ex: 'Villa Morra, Carmelitas, Las Mercedes y Santa Trinidad concentran la demanda de alquiler. Precios de referencia y qué rinde cada eje comercial.',
    fecha: 'Octubre 2026',
    portada: { cifra: '1.500–2.500', pie: 'USD por m² en las zonas premium de Asunción' },
    cuerpo: [
      { t: 'p', x: 'Asunción concentra la inversión en pisos; el área metropolitana (el departamento Central) concentra lotes y casas. Si buscas renta en alquiler, la ubicación dentro de la capital es lo primero que hay que decidir.' },
      { t: 'h2', x: 'Las zonas con más demanda de alquiler' },
      { t: 'p', x: 'Villa Morra, Carmelitas, Las Mercedes y Santa Trinidad reúnen la mayor demanda de alquiler de la ciudad: son la zona comercial y diplomática, con torres de pisos y oficinas. Además, el 83 % de los compradores de clase media prefiere vivir en Asunción por seguridad y cercanía al trabajo, según un estudio de Metro Research publicado por ABC.' },
      { t: 'dato', v: 'USD 1.500–2.500', x: 'Precio de referencia del m² en las zonas premium de Asunción. En zonas emergentes, entre USD 900 y 1.400.', f: { nombre: 'La Nación', url: 'https://www.lanacion.com.py/negocios/2025/08/12/mercado-inmobiliario-paraguayo-se-consolida-como-uno-de-los-mas-atractivos-de-la-region/' } },
      { t: 'p', x: 'Es uno de los metros cuadrados más baratos de la región. El perfil inversor busca 1 y 2 dormitorios de entre USD 55.000 y 95.000; quien compra para vivir, 2 dormitorios de entre USD 100.000 y 150.000.' },
      { t: 'h2', x: 'Alrededor de la capital' },
      { t: 'p', x: 'Luque, San Lorenzo y Fernando de la Mora aparecen en el mismo estudio como alternativas más baratas para casas, dúplex y lotes. Según InfoCasas, el 70 % de la demanda está en Asunción y el 25 % en el departamento Central. Fuera del área metropolitana, Ciudad del Este destaca por el comercio con Brasil.' },
      { t: 'h2', x: 'Oficinas y locales: qué rinde cada eje' },
      { t: 'p', x: 'Si el ticket lo permite, lo comercial rinde más que la vivienda: entre un 8 y un 15 % bruto anual según estimaciones del sector. No hay fuente oficial; estos datos son de la consultora Paraguay Resident (mayo de 2026).' },
      { t: 'tabla', cab: ['Zona', 'Oficina, USD/m²/mes', 'Local, USD/m²/mes', 'Rendimiento bruto'], filas: [
        ['Aviadores del Chaco', '14–20', 'Sin dato', 'Oficinas 8–10 %'],
        ['Villa Morra / Mariscal López', '10–16', '18–30', 'Oficinas 8–11 %, locales 10–14 %'],
        ['Carmelitas', 'Sin dato', '20–35', '9–12 %'],
        ['Santa Teresa / Shopping del Sol', '8–14', 'Sin dato', '9–12 %'],
        ['España / Centro', 'Sin dato', '8–15', '10–15 %']
      ] },
      { t: 'p', x: 'La misma fuente sitúa la vacancia en un 8–12 % para oficinas de clase A y un 12–18 % para las de clase B. Como referencia de precio, el local comercial anunciado en Asunción tiene una mediana de USD 993/m², según TuLugar.' },
      { t: 'h2', x: 'Cómo elegir' },
      { t: 'list', items: [
        'Para renta de larga estancia: cerca de los ejes de oficinas y servicios, donde vive y trabaja el inquilino profesional.',
        'Para alquiler temporal: confirma antes que el reglamento del edificio lo permite.',
        'Para oficinas o locales: cuenta con un ticket más alto y menos compradores a la hora de revender.'
      ] }
    ],
    fuentes: [
      { nombre: 'Infonegocios Legal: invertir en departamentos en Paraguay', url: 'https://infonegocios.com.py/infolegal/invertir-en-departamentos-en-paraguay-introduccion-general-para-el-inversionista' },
      { nombre: 'ABC: estudio de precios y zonas en Asunción y alrededores', url: 'https://www.abc.com.py/economia/2024/11/06/estudio-revela-precios-preferencias-y-zonas-para-comprar-viviendas-en-asuncion-y-alrededores/' },
      { nombre: 'La Nación: el mercado paraguayo, uno de los más atractivos de la región', url: 'https://www.lanacion.com.py/negocios/2025/08/12/mercado-inmobiliario-paraguayo-se-consolida-como-uno-de-los-mas-atractivos-de-la-region/' },
      { nombre: 'Última Hora: crece el interés por viviendas (InfoCasas, ene–abr 2026)', url: 'https://www.ultimahora.com/crece-interes-por-viviendas-pero-persisten-desafios-para-el-credito' },
      { nombre: 'Paraguay Resident: oficinas y locales en Asunción (2026)', url: 'https://www.paraguay-resident.com.py/en/blogs/news/bureau-commerce-asuncion-zones-rendements-strategies-2026' },
      { nombre: 'TuLugar: mercado de Asunción', url: 'https://tulugar.com/en/market/paraguay/asuncion' }
    ]
  },
  {
    slug: 'precio-lotes-paraguay-por-ciudad',
    cat: 'Guías',
    t: 'Lotes en Paraguay: precio por ciudad y cuánto se revalorizan',
    ex: 'Un lote urbano cuesta de mediana USD 24.000 en Capiatá y USD 180.000 en Asunción. Precios de octubre de 2026 y lo que se sabe (y no) de su revalorización.',
    fecha: 'Octubre 2026',
    portada: { cifra: 'USD 24.000', pie: 'mediana de un lote urbano en Capiatá; en Asunción, USD 180.000' },
    cuerpo: [
      { t: 'p', x: 'El lote es el producto inmobiliario más paraguayo: ahorro y revalorización a largo plazo, sin renta mensual. Cuanto más lejos de la capital, más barato es el m² y más depende la inversión de cómo crezca el barrio.' },
      { t: 'h2', x: 'Precio por ciudad' },
      { t: 'p', x: 'Medianas de anuncios activos de TuLugar, actualizadas entre el 28 de septiembre y el 15 de octubre de 2026. El precio por m² se calcula sobre la superficie del terreno.' },
      { t: 'tabla', cab: ['Ciudad', 'USD/m²', 'Lote urbano < 500 m²', 'Terreno 500–2.000 m²'], filas: [
        ['Asunción', '494', 'USD 180.000', 'USD 407.000'],
        ['Fernando de la Mora', '265', 'USD 109.000', 'USD 202.000'],
        ['Lambaré', '195', 'USD 76.000', 'USD 160.000'],
        ['Ciudad del Este', '182', 'USD 73.000', 'USD 184.000'],
        ['Luque', '149', 'USD 55.000', 'USD 168.000'],
        ['San Lorenzo', '149', 'USD 59.000', 'USD 134.000'],
        ['Mariano Roque Alonso', '108', 'USD 53.000', 'USD 97.000'],
        ['Encarnación', '86', 'USD 35.000', 'USD 95.000'],
        ['San Bernardino', '72', 'USD 34.000', 'USD 73.000'],
        ['Limpio', '58', 'USD 25.000', 'USD 66.000'],
        ['Capiatá', '56', 'USD 24.000', 'USD 47.000'],
        ['Total Paraguay', '136', 'USD 67.000', 'USD 149.000']
      ] },
      { t: 'p', x: 'Ojo: son precios anunciados, no de ventas cerradas. Paraguay no tiene un registro público de precios de cierre y el precio final suele negociarse a la baja.' },
      { t: 'h2', x: 'Los loteamientos en cuotas' },
      { t: 'p', x: 'Los loteamientos que se venden a plazos suelen estar en la periferia y por debajo de estas medianas. Por ejemplo, en un loteamiento de Itauguá, un lote desde 360 m² cuesta desde G. 40 millones al contado (unos USD 6.700), o una entrega de G. 8 millones y cuotas desde G. 860.450. Se paga directamente al loteador, en 100 a 180 cuotas en guaraníes, y la escritura se firma al terminar de pagar.' },
      { t: 'h2', x: '¿Cuánto se revalorizan?' },
      { t: 'p', x: 'No existe una serie pública y medida de la revalorización de lotes en Paraguay. Lo que hay son estimaciones del sector:' },
      { t: 'list', items: [
        'Un informe de 2017 de la cámara de loteadoras con MCS Consultora habló de un 8–10 % anual por encima de la inflación y de precios que se duplicaron en cuatro años. Es un dato antiguo.',
        'El director de Sotheby’s Realty Paraguay proyecta para 2028 una plusvalía del 50 % en Limpio, 30 % en Luque, 23 % en Mariano Roque Alonso, 15 % en San Lorenzo, 12,5 % en Fernando de la Mora y 12 % en Lambaré. Es la proyección de un agente, sin metodología publicada.'
      ] },
      { t: 'dato', v: '+50 %', x: 'Plusvalía proyectada a 2028 para Limpio, la más alta de Gran Asunción. Tómala como estimación, no como dato medido.', f: { nombre: 'La Nación', url: 'https://foco.lanacion.com.py/2025/05/16/las-6-ciudades-de-gran-asuncion-con-mayor-plusvalia/' } },
      { t: 'h2', x: 'Antes de comprar un lote' },
      { t: 'list', items: [
        'Comprueba que el loteamiento tiene aprobación municipal y servicios (agua, luz, calles).',
        'Pregunta cuándo y cómo se escritura.',
        'Ten en cuenta que, según el artículo 782 del Código Civil, pagado el 25 % del precio el vendedor en principio ya no puede rescindir y quedarse con lo pagado.',
        'Distingue loteamiento y barrio cerrado: tienen reglas legales distintas.'
      ] },
      { t: 'p', x: 'Si inviertes desde España, el lote en cuotas en guaraníes suele encajar peor que un piso en dólares para alquilar. Pero si piensas en un horizonte largo, es una opción que merece la pena conocer.' }
    ],
    fuentes: [
      { nombre: 'TuLugar: mercado de Paraguay por ciudad', url: 'https://tulugar.com/en/market/paraguay' },
      { nombre: 'TuLugar: metodología', url: 'https://tulugar.com/en/market/paraguay/methodology' },
      { nombre: 'Irún Inmobiliaria: loteamiento en Itauguá', url: 'https://www.iruninmobiliaria.com.py/loteamientos/itaugua/' },
      { nombre: 'Última Hora: los precios de terrenos y lotes se duplicaron en 4 años (2017)', url: 'https://www.ultimahora.com/los-precios-terrenos-y-lotes-se-duplicaron-los-ultimos-4-anos-n1122382' },
      { nombre: 'La Nación: las 6 ciudades de Gran Asunción con mayor plusvalía', url: 'https://foco.lanacion.com.py/2025/05/16/las-6-ciudades-de-gran-asuncion-con-mayor-plusvalia/' },
      { nombre: 'Infonegocios Legal: rescisión tras pagar el 25 %', url: 'https://infonegocios.com.py/infolegal/se-puede-resolver-un-contrato-de-compraventa-de-inmueble-despues-de-pagar-el-25' },
      { nombre: 'Infonegocios Legal: loteamientos vs. barrios cerrados', url: 'https://infonegocios.com.py/infolegal/loteamientos-vs-barrios-cerrados-una-comparacion-bajo-la-optica-legal-paraguaya' }
    ]
  }
];
