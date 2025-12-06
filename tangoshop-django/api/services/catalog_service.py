from api.utils.firebase_config import db

class CatalogService:
    def get_reseller_catalog(self, reseller_id: str) -> dict:

        reseller_doc = db.collection('resellers').document(reseller_id).get()
        if not reseller_doc.exists:
            raise ValueError('Revendedor no encontrado')
        
        reseller_data = reseller_doc.to_dict()
        default_markup_type = reseller_data.get('markupType', 'percentage')
        default_markup_value = reseller_data.get('defaultMarkupValue', 0)

        favorites_snap = db.collection('favorites') \
            .where('resellerId', '==', reseller_id) \
            .where('isActive', '==', True) \
            .get()

        if not favorites_snap:
            return {
                'totalProducts': 0,
                'products': []
            }

        products_list = []
        
        for fav_doc in favorites_snap:
            fav_data = fav_doc.to_dict()
            product_id = fav_data.get('productId')
            
            product_doc = db.collection('products').document(product_id).get()
            if not product_doc.exists or not product_doc.to_dict().get('isActive'):
                continue
            
            product_data = product_doc.to_dict()
            base_price = product_data.get('price', 0)
            
            markup_type = fav_data.get('markupType', 'default')
            markup_value = fav_data.get('markupValue', 0)
            
            if markup_type == 'default':
                markup_type = default_markup_type
                markup_value = default_markup_value

            if markup_type == 'fixed':
                final_price = base_price + markup_value
            elif markup_type == 'percentage':
                final_price = base_price * (1 + markup_value / 100)
            else:
                final_price = base_price
            
            final_price = round(final_price, 2)
            
            products_list.append({
                'productId': product_id,
                'name': product_data.get('name'),
                'basePrice': base_price,
                'markupType': markup_type,
                'markupValue': markup_value,
                'finalPrice': final_price
            })

        return {
            'totalProducts': len(products_list),
            'products': products_list
        }

catalog_service = CatalogService()