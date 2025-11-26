const { db, admin } = require('../../config/firebase');

async function addFavoritesCollection() {
  try {
    console.log('🚀 Agregando colección de favoritos...\n');

    // Obtener el revendedor de prueba
    const resellerSnapshot = await db.collection('users')
      .where('email', '==', 'revendedor@test.com')
      .get();

    if (resellerSnapshot.empty) {
      console.log('❌ No se encontró el revendedor de prueba');
      process.exit(1);
    }

    const resellerId = resellerSnapshot.docs[0].id;
    console.log(`✅ Revendedor encontrado: ${resellerId}`);

    // Obtener algunos productos aleatorios
    const productsSnapshot = await db.collection('products')
      .limit(5)
      .get();

    if (productsSnapshot.empty) {
      console.log('❌ No hay productos en la BD');
      process.exit(1);
    }

    const products = productsSnapshot.docs;
    console.log(`✅ ${products.length} productos encontrados\n`);

    // Crear favoritos de ejemplo
    console.log('⭐ Creando favoritos de prueba...');
    
    const favorites = [
      {
        resellerId: resellerId,
        productId: products[0].id,
        supplierId: products[0].data().supplierId,
        markupType: 'percentage',
        markupValue: 10,
        isActive: true
      },
      {
        resellerId: resellerId,
        productId: products[1].id,
        supplierId: products[1].data().supplierId,
        markupType: 'fixed',
        markupValue: 150,
        isActive: true
      },
      {
        resellerId: resellerId,
        productId: products[2].id,
        supplierId: products[2].data().supplierId,
        markupType: 'percentage',
        markupValue: 25,
        isActive: true
      }
    ];

    let addedCount = 0;
    for (const favorite of favorites) {
      // Verificar si ya existe
      const existingFav = await db.collection('favorites')
        .where('resellerId', '==', favorite.resellerId)
        .where('productId', '==', favorite.productId)
        .get();

      if (existingFav.empty) {
        await db.collection('favorites').add({
          ...favorite,
          addedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        const productData = products.find(p => p.id === favorite.productId).data();
        console.log(`   ✅ ${productData.name} - Markup: ${favorite.markupValue}${favorite.markupType === 'percentage' ? '%' : '$'}`);
        addedCount++;

        // Incrementar favoritesCount del producto
        await db.collection('products').doc(favorite.productId).update({
          favoritesCount: admin.firestore.FieldValue.increment(1)
        });
      } else {
        console.log(`   ⚠️  Favorito ya existe para producto ${favorite.productId}`);
      }
    }

    // Actualizar stats del revendedor
    await db.collection('resellers').doc(resellerId).update({
      'stats.totalFavorites': admin.firestore.FieldValue.increment(addedCount)
    });

    console.log('\n' + '='.repeat(50));
    console.log('✅ COLECCIÓN FAVORITES CREADA');
    console.log('='.repeat(50));
    console.log(`\n📊 ${addedCount} favoritos agregados exitosamente\n`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

addFavoritesCollection();