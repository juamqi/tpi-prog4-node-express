const { db, admin } = require('../src/config/firebase');
const bcrypt = require('bcryptjs');

async function initializeDatabase() {
  try {
    console.log('🚀 Inicializando base de datos TangoShop...\n');

    // ========================================
    // 1. CREAR CATEGORÍAS GENERALES
    // ========================================
    console.log('📁 Creando categorías...');
    
    const categories = [
      {
        name: 'Tecnología',
        description: 'Productos electrónicos, gadgets y accesorios tecnológicos',
        productCount: 0
      },
      {
        name: 'Calzado',
        description: 'Zapatos deportivos, formales, casuales y accesorios',
        productCount: 0
      },
      {
        name: 'Indumentaria',
        description: 'Ropa y accesorios de vestir para todas las ocasiones',
        productCount: 0
      },
      {
        name: 'Hogar y Decoración',
        description: 'Artículos para el hogar, muebles y decoración',
        productCount: 0
      },
      {
        name: 'Deportes y Fitness',
        description: 'Equipamiento deportivo, suplementos y accesorios',
        productCount: 0
      },
      {
        name: 'Belleza y Cuidado Personal',
        description: 'Productos de belleza, cosmética y cuidado personal',
        productCount: 0
      },
      {
        name: 'Accesorios',
        description: 'Complementos, bijouterie y accesorios varios',
        productCount: 0
      }
    ];

    const categoryIds = [];
    for (const category of categories) {
      const docRef = await db.collection('categories').add({
        ...category,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      categoryIds.push(docRef.id);
      console.log(`   ✅ Categoría creada: ${category.name} (ID: ${docRef.id})`);
    }

    // ========================================
    // 2. CREAR USUARIO PROVEEDOR DE PRUEBA
    // ========================================
    console.log('\n👤 Creando usuario proveedor de prueba...');
    
    const supplierPassword = await bcrypt.hash('Proveedor123', 10);
    
    const supplierUserRef = await db.collection('users').add({
      email: 'proveedor@test.com',
      password: supplierPassword,
      firstName: 'Carlos',
      lastName: 'Martínez',
      userType: 'supplier',
      phone: '+54 9 362 4123456',
      website: 'https://distribuidoraargentina.com.ar',
      photoURL: '',
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    const supplierId = supplierUserRef.id;
    console.log(`   ✅ Usuario proveedor creado (ID: ${supplierId})`);
    console.log(`   📧 Email: proveedor@test.com`);
    console.log(`   🔑 Password: Proveedor123`);

    // Crear documento en colección suppliers
    await db.collection('suppliers').doc(supplierId).set({
      userId: supplierId,
      companyName: 'Distribuidora Argentina SRL',
      address: {
        province: 'Chaco',
        city: 'Resistencia',
        street: 'Av. 25 de Mayo',
        number: '850'
      },
      stats: {
        totalProducts: 0,
        avgRating: 0,
        totalReviews: 0,
        totalFavorites: 0
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`   ✅ Perfil de proveedor creado`);

    // ========================================
    // 3. CREAR USUARIO REVENDEDOR DE PRUEBA
    // ========================================
    console.log('\n👤 Creando usuario revendedor de prueba...');
    
    const resellerPassword = await bcrypt.hash('Revendedor123', 10);
    
    const resellerUserRef = await db.collection('users').add({
      email: 'revendedor@test.com',
      password: resellerPassword,
      firstName: 'Laura',
      lastName: 'Fernández',
      userType: 'reseller',
      phone: '+54 9 362 4987654',
      website: 'https://mitiendaonline.com.ar',
      photoURL: '',
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    const resellerId = resellerUserRef.id;
    console.log(`   ✅ Usuario revendedor creado (ID: ${resellerId})`);
    console.log(`   📧 Email: revendedor@test.com`);
    console.log(`   🔑 Password: Revendedor123`);

    // Crear documento en colección resellers
    await db.collection('resellers').doc(resellerId).set({
      userId: resellerId,
      markupType: 'percentage',
      defaultMarkupValue: 20,
      catalogSettings: {
        isPublic: true,
        lastGenerated: null,
        catalogUrl: ''
      },
      stats: {
        totalFavorites: 0
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`   ✅ Perfil de revendedor creado (markup por defecto: 20%)`);

    // ========================================
    // 4. CREAR PRODUCTOS DE PRUEBA (VARIADOS)
    // ========================================
    console.log('\n📦 Creando productos de prueba...');
    
    const products = [
      // TECNOLOGÍA
      {
        name: 'Auriculares Bluetooth TWS',
        description: 'Auriculares inalámbricos con cancelación de ruido, batería de 24hs',
        price: 15000,
        categoryId: categoryIds[0] // Tecnología
      },
      {
        name: 'Smartwatch Deportivo',
        description: 'Reloj inteligente con monitor de frecuencia cardíaca y GPS',
        price: 45000,
        categoryId: categoryIds[0] // Tecnología
      },
      {
        name: 'Cargador Inalámbrico Rápido',
        description: 'Cargador wireless 15W compatible con iPhone y Android',
        price: 8500,
        categoryId: categoryIds[0] // Tecnología
      },
      
      // CALZADO
      {
        name: 'Zapatillas Running ProSport',
        description: 'Zapatillas deportivas con amortiguación especial para correr',
        price: 32000,
        categoryId: categoryIds[1] // Calzado
      },
      {
        name: 'Botas de Cuero Premium',
        description: 'Botas elegantes de cuero genuino, ideales para ocasiones formales',
        price: 48000,
        categoryId: categoryIds[1] // Calzado
      },
      {
        name: 'Ojotas Deportivas Comfort',
        description: 'Ojotas ergonómicas con suela antideslizante',
        price: 7500,
        categoryId: categoryIds[1] // Calzado
      },
      
      // INDUMENTARIA
      {
        name: 'Remera Oversize Urbana',
        description: 'Remera de algodón 100%, diseño moderno y cómodo',
        price: 9800,
        categoryId: categoryIds[2] // Indumentaria
      },
      {
        name: 'Campera Deportiva Impermeable',
        description: 'Campera con capucha, resistente al agua y al viento',
        price: 28000,
        categoryId: categoryIds[2] // Indumentaria
      },
      {
        name: 'Jean Clásico Fit Regular',
        description: 'Pantalón jean de mezclilla, corte clásico y confortable',
        price: 18500,
        categoryId: categoryIds[2] // Indumentaria
      },
      
      // HOGAR Y DECORACIÓN
      {
        name: 'Difusor de Aromas LED',
        description: 'Difusor ultrasónico con luz LED de colores, 300ml',
        price: 12000,
        categoryId: categoryIds[3] // Hogar y Decoración
      },
      {
        name: 'Set de Sábanas Premium',
        description: 'Juego de sábanas de microfibra suave, 2 plazas',
        price: 16500,
        categoryId: categoryIds[3] // Hogar y Decoración
      },
      
      // DEPORTES Y FITNESS
      {
        name: 'Colchoneta Yoga Mat Pro',
        description: 'Mat de yoga antideslizante 6mm, incluye bolso de transporte',
        price: 11000,
        categoryId: categoryIds[4] // Deportes y Fitness
      },
      {
        name: 'Mancuernas Regulables 20kg',
        description: 'Par de mancuernas con pesos intercambiables, hasta 20kg',
        price: 35000,
        categoryId: categoryIds[4] // Deportes y Fitness
      },
      
      // BELLEZA Y CUIDADO PERSONAL
      {
        name: 'Set Skincare Completo',
        description: 'Kit de cuidado facial: limpiador, tónico, sérum y crema hidratante',
        price: 22000,
        categoryId: categoryIds[5] // Belleza y Cuidado Personal
      },
      {
        name: 'Secador de Pelo Profesional',
        description: 'Secador iónico 2000W con difusor y concentrador',
        price: 28500,
        categoryId: categoryIds[5] // Belleza y Cuidado Personal
      },
      
      // ACCESORIOS
      {
        name: 'Mochila Urbana Impermeable',
        description: 'Mochila con compartimento para laptop 15", puerto USB',
        price: 19500,
        categoryId: categoryIds[6] // Accesorios
      },
      {
        name: 'Gafas de Sol Polarizadas',
        description: 'Anteojos con protección UV400 y estuche incluido',
        price: 8900,
        categoryId: categoryIds[6] // Accesorios
      },
      {
        name: 'Billetera de Cuero Slim',
        description: 'Billetera minimalista de cuero genuino con bloqueo RFID',
        price: 6500,
        categoryId: categoryIds[6] // Accesorios
      }
    ];

    const productIds = [];
    let productCount = 0;
    
    for (const product of products) {
      const docRef = await db.collection('products').add({
        ...product,
        supplierId: supplierId,
        photoURL: '',
        rating: 0,
        reviewCount: 0,
        favoritesCount: 0,
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      productIds.push(docRef.id);
      productCount++;
      console.log(`   ✅ Producto ${productCount}: ${product.name} ($${product.price})`);
      
      // Actualizar contador en categoría
      await db.collection('categories').doc(product.categoryId).update({
        productCount: admin.firestore.FieldValue.increment(1)
      });
    }

    // Actualizar totalProducts del proveedor
    await db.collection('suppliers').doc(supplierId).update({
      'stats.totalProducts': products.length
    });

    // ========================================
    // 5. CREAR NOTIFICACIÓN DE BIENVENIDA
    // ========================================
    console.log('\n📬 Creando notificaciones de bienvenida...');
    
    // Notificación para proveedor
    await db.collection('notifications').add({
      userId: supplierId,
      type: 'welcome',
      message: '¡Bienvenido a TangoShop! Comienza a gestionar tus productos.',
      data: {},
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Notificación para revendedor
    await db.collection('notifications').add({
      userId: resellerId,
      type: 'welcome',
      message: '¡Bienvenido a TangoShop! Explora productos y crea tu catálogo.',
      data: {},
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('   ✅ Notificaciones de bienvenida creadas');

    // ========================================
    // RESUMEN FINAL
    // ========================================
    console.log('\n' + '='.repeat(70));
    console.log('✅ BASE DE DATOS INICIALIZADA CORRECTAMENTE');
    console.log('='.repeat(70));
    console.log('\n📊 RESUMEN:');
    console.log(`   • ${categories.length} categorías creadas`);
    console.log(`   • 1 proveedor creado (proveedor@test.com)`);
    console.log(`   • 1 revendedor creado (revendedor@test.com)`);
    console.log(`   • ${products.length} productos creados`);
    console.log(`   • 2 notificaciones de bienvenida creadas`);
    
    console.log('\n📁 CATEGORÍAS CREADAS:');
    categories.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.name}`);
    });
    
    console.log('\n🔐 CREDENCIALES DE PRUEBA:');
    console.log('\n   👔 Proveedor:');
    console.log('      Email:    proveedor@test.com');
    console.log('      Password: Proveedor123');
    console.log('      Empresa:  Distribuidora Argentina SRL');
    console.log('      Ubicación: Resistencia, Chaco');
    
    console.log('\n   🛍️  Revendedor:');
    console.log('      Email:    revendedor@test.com');
    console.log('      Password: Revendedor123');
    console.log('      Nombre:   Laura Fernández');
    console.log('      Markup:   20% (porcentual)');
    
    console.log('\n💡 PRÓXIMOS PASOS:');
    console.log('   1. Verificar los datos en Firebase Console');
    console.log('   2. Iniciar el servidor: npm run dev');
    console.log('   3. Probar el endpoint: GET http://localhost:3000/test-db');
    console.log('   4. Comenzar a desarrollar los endpoints\n');
    
    console.log('🚀 ¡Todo listo para empezar a desarrollar!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error al inicializar la base de datos:', error);
    console.error('\n🔍 Detalles del error:');
    console.error(error.message);
    console.error('\n💡 Posibles soluciones:');
    console.error('   1. Verifica que serviceAccountKey.json esté en la raíz');
    console.error('   2. Verifica que las reglas de Firestore estén en modo test');
    console.error('   3. Verifica tu conexión a Internet');
    console.error('   4. Verifica que bcryptjs esté instalado: npm install bcryptjs\n');
    process.exit(1);
  }
}

// Ejecutar la inicialización
console.log('⏳ Conectando a Firebase...\n');
initializeDatabase();