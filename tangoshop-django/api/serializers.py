from rest_framework import serializers

class RegisterResellerSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, min_length=8)
    firstName = serializers.CharField(required=True, min_length=2, max_length=50)
    lastName = serializers.CharField(required=True, min_length=2, max_length=50)
    phone = serializers.CharField(required=False, allow_blank=True)
    website = serializers.CharField(required=False, allow_blank=True)
    
    def validate_password(self, value):
        import re
        if not re.match(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)', value):
            raise serializers.ValidationError(
                'La contraseña debe contener mayusculas, minusculas y numeros'
            )
        return value

class RegisterSupplierSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, min_length=8)
    companyName = serializers.CharField(required=True, min_length=2, max_length=100)
    phone = serializers.CharField(required=True)
    website = serializers.CharField(required=True)
    address = serializers.DictField(required=True)

    def validate_password(self, value):
        import re
        if not re.match(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)', value):
            raise serializers.ValidationError(
                'La contraseña debe contener mayusculas, minusculas y numeros'
            )
        return value
    
    def validate_phone(self, value):
        import re
        if not re.match(r'^[0-9+\-\s()]+$', value):
            raise serializers.ValidationError(
                'El telefono debe contener solo numeros y simbolos validos'
            )
        return value
    
    def validate_address(self, value):
        required_fields = ['province', 'city', 'street', 'number']
        for field in required_fields:
            if not value.get(field):
                raise serializers.ValidationError(
                    f'El campo {field} es obligatorio en la direccion'
                )
        return value

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True)

class ProductSerializer(serializers.Serializer):
    name = serializers.CharField()
    description = serializers.CharField(required=False, allow_blank=True)
    price = serializers.FloatField()
    categoryId = serializers.CharField()
    photoURL = serializers.CharField(required=False, allow_blank=True)

class ReactivateAccountSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, min_length=8)