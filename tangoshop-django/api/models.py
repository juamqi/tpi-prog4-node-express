from dataclasses import dataclass
from typing import Optional

@dataclass
class Address:
    province: Optional[str] = None
    city: Optional[str] = None
    street: Optional[str] = None
    number: Optional[str] = None


@dataclass
class SupplierStats:
    totalProducts: int = 0
    avgRating: float = 0
    totalReviews: int = 0
    totalFavorites: int = 0


@dataclass
class Product:
    name: str
    description: str
    price: float
    categoryId: str
    supplierId: str
    photoURL: str = ''
    rating: float = 0
    reviewCount: int = 0
    favoritesCount: int = 0
    isActive: bool = True