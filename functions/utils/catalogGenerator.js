/**
 * Generar HTML del catálogo
 */
function generateHTML(data) {
  const {
    resellerName,
    resellerWebsite,
    resellerPhone,
    productsByCategory,
    generatedAt,
  } = data;

  const categoriesHTML = Object.entries(productsByCategory)
    .map(([categoryName, products]) => {
      const productsHTML = products
        .map((product) => {
          return `
            <div class="product-card">
              <div class="product-image">
                ${product.photoURL 
                  ? `<img src="${product.photoURL}" alt="${product.name}">`
                  : '<div class="no-image">Sin imagen</div>'
                }
              </div>
              <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description || ''}</p>
                <div class="product-footer">
                  <div class="product-price">
                    <span class="currency">$</span>
                    <span class="price">${product.finalPrice.toLocaleString('es-AR')}</span>
                  </div>
                  ${product.rating > 0 ? `
                    <div class="product-rating">
                      <span class="stars">${'*'.repeat(Math.round(product.rating))}</span>
                      <span class="rating-number">${product.rating.toFixed(1)}</span>
                    </div>
                  ` : ''}
                </div>
              </div>
            </div>
          `;
        })
        .join('');

      return `
        <section class="category-section">
          <h2 class="category-title">${categoryName}</h2>
          <div class="products-grid">
            ${productsHTML}
          </div>
        </section>
      `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Catálogo - ${resellerName}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: #f5f5f5;
          color: #333;
          line-height: 1.6;
        }

        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px 20px;
          text-align: center;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .header h1 {
          font-size: 2.5rem;
          margin-bottom: 10px;
        }

        .header .subtitle {
          font-size: 1.2rem;
          opacity: 0.9;
        }

        .contact-info {
          background: white;
          padding: 20px;
          text-align: center;
          border-bottom: 2px solid #eee;
        }

        .contact-info p {
          margin: 5px 0;
          color: #666;
        }

        .contact-info a {
          color: #667eea;
          text-decoration: none;
          font-weight: 500;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        .category-section {
          margin-bottom: 60px;
        }

        .category-title {
          font-size: 2rem;
          color: #333;
          margin-bottom: 30px;
          padding-bottom: 10px;
          border-bottom: 3px solid #667eea;
        }

        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 30px;
        }

        .product-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .product-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 5px 20px rgba(0,0,0,0.15);
        }

        .product-image {
          width: 100%;
          height: 250px;
          overflow: hidden;
          background: #f9f9f9;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .no-image {
          color: #999;
          font-size: 1.1rem;
        }

        .product-info {
          padding: 20px;
        }

        .product-name {
          font-size: 1.3rem;
          color: #333;
          margin-bottom: 10px;
          min-height: 60px;
        }

        .product-description {
          font-size: 0.95rem;
          color: #666;
          margin-bottom: 15px;
          min-height: 60px;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
        }

        .product-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 15px;
          border-top: 1px solid #eee;
        }

        .product-price {
          font-size: 1.8rem;
          font-weight: bold;
          color: #667eea;
        }

        .currency {
          font-size: 1.2rem;
        }

        .product-rating {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .stars {
          font-size: 0.9rem;
        }

        .rating-number {
          font-size: 0.9rem;
          color: #666;
          font-weight: 500;
        }

        .footer {
          background: #333;
          color: white;
          text-align: center;
          padding: 30px 20px;
          margin-top: 60px;
        }

        .footer p {
          margin: 5px 0;
          opacity: 0.8;
        }

        .generated-date {
          font-size: 0.85rem;
          color: #999;
          margin-top: 10px;
        }

        @media (max-width: 768px) {
          .header h1 {
            font-size: 1.8rem;
          }

          .products-grid {
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 20px;
          }

          .category-title {
            font-size: 1.5rem;
          }
        }

        @media print {
          .product-card {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${resellerName}</h1>
        <p class="subtitle">Calogo de Productos</p>
      </div>

      <div class="contact-info">
        ${resellerPhone ? `<p><strong>Telfono:</strong> ${resellerPhone}</p>` : ''}
        ${resellerWebsite ? `<p><strong>Web:</strong> <a href="${resellerWebsite}" target="_blank">${resellerWebsite}</a></p>` : ''}
      </div>

      <div class="container">
        ${categoriesHTML}
      </div>

      <div class="footer">
        <p><strong>${resellerName}</strong></p>
        ${resellerPhone ? `<p>Telefono: ${resellerPhone}</p>` : ''}
        ${resellerWebsite ? `<p>Web: ${resellerWebsite}</p>` : ''}
        <p class="generated-date">Catalogo generado el ${new Date(generatedAt).toLocaleDateString('es-AR')}</p>
        <p style="margin-top: 20px; opacity: 0.6;">Powered by TangoShop</p>
      </div>
    </body>
    </html>
  `;
}

module.exports = {
  generateHTML,
};