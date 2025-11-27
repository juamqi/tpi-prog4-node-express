from api.utils.firebase_config import db

class SupplierService:
    def get_resellers_high_markup(self, supplier_id: str, product_id: str) -> dict:

        product_doc = db.collection('products').document(product_id).get()
        if not product_doc.exists:
            raise ValueError('Producto no encontrado')
        
        product_data = product_doc.to_dict()
        if product_data.get('supplierId') != supplier_id:
            raise ValueError('Este producto no te pertenece')
        
        base_price = product_data.get('price', 0)
        
        favorites_snap = db.collection('favorites') \
            .where('productId', '==', product_id) \
            .where('isActive', '==', True) \
            .get()
        
        resellers_list = []
        
        for fav_doc in favorites_snap:
            fav_data = fav_doc.to_dict()
            reseller_id = fav_data.get('resellerId')
            
            reseller_doc = db.collection('resellers').document(reseller_id).get()
            if not reseller_doc.exists:
                continue
            
            reseller_data = reseller_doc.to_dict()
            
            markup_type = fav_data.get('markupType', 'default')
            markup_value = fav_data.get('markupValue', 0)
            
            if markup_type == 'default':
                markup_type = reseller_data.get('markupType', 'percentage')
                markup_value = reseller_data.get('defaultMarkupValue', 0)
            
            if markup_type == 'fixed':
                final_price = base_price + markup_value
            elif markup_type == 'percentage':
                final_price = base_price * (1 + markup_value / 100)
            else:
                final_price = base_price
            
            percentage_increase = ((final_price - base_price) / base_price) * 100
            
            if percentage_increase > 20:

                user_doc = db.collection('users').document(reseller_id).get()
                user_data = user_doc.to_dict() if user_doc.exists else {}
                
                resellers_list.append({
                    'resellerId': reseller_id,
                    'firstName': user_data.get('firstName'),
                    'lastName': user_data.get('lastName'),
                    'email': user_data.get('email'),
                    'finalPrice': round(final_price, 2),
                    'percentageIncrease': round(percentage_increase, 2)
                })
        
        return {
            'productId': product_id,
            'productName': product_data.get('name'),
            'basePrice': base_price,
            'totalResellers': len(resellers_list),
            'resellers': resellers_list
        }

supplier_service = SupplierService()