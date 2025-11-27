from rest_framework import serializers

class RegisterResellerSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()
    firstName = serializers.CharField()
    lastName = serializers.CharField()
    phone = serializers.CharField(required=False, allow_blank=True)
    website = serializers.CharField(required=False, allow_blank=True)

class RegisterSupplierSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()
    companyName = serializers.CharField()
    phone = serializers.CharField(required=False, allow_blank=True)
    website = serializers.CharField(required=False, allow_blank=True)
    address = serializers.DictField(child=serializers.CharField(), required=False)

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

class ProductSerializer(serializers.Serializer):
    name = serializers.CharField()
    description = serializers.CharField(required=False, allow_blank=True)
    price = serializers.FloatField()
    categoryId = serializers.CharField()
    photoURL = serializers.CharField(required=False, allow_blank=True)