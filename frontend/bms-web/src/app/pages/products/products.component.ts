import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoriesService } from '../../services/categories';
import { ProductsService } from '../../services/products.service';
import { CategoryDto, CreateCategoryDto } from '../../models/category';
import { CreateProductDto, ProductDto, UpdateProductDto } from '../../models/product';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './products.html',
  styleUrls: ['./products.css']
})
export class ProductsComponent implements OnInit {
  products = signal<ProductDto[]>([]);
  categories = signal<CategoryDto[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  query = signal('');
  showForm = signal(false);
  creating = signal(false);
  formMessage = signal<string | null>(null);
  editingId = signal<number | null>(null);
  savingEdit = signal(false);
  editMessage = signal<string | null>(null);
  newProduct: CreateProductDto = {
    name: '',
    price: 0,
    stock: 0,
    categoryId: 0
  };
  editProduct: UpdateProductDto = {
    name: '',
    price: 0,
    stock: 0,
    categoryId: 0
  };
  newCategory: CreateCategoryDto = {
    name: ''
  };

  readonly filteredProducts = computed(() => {
    const query = this.query().trim().toLowerCase();
    const items = this.products();
    if (!query) return items;

    return items.filter((product) => {
      return (
        product.name.toLowerCase().includes(query) ||
        (product.categoryName ?? '').toLowerCase().includes(query)
      );
    });
  });

  readonly stats = computed(() => {
    const items = this.filteredProducts();
    const totalStock = items.reduce((sum, item) => sum + item.stock, 0);
    const inventoryValue = items.reduce((sum, item) => sum + item.stock * item.price, 0);
    const lowStock = items.filter((item) => item.stock <= 5).length;

    return { count: items.length, totalStock, inventoryValue, lowStock };
  });

  private readonly money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

  constructor(
    private productsService: ProductsService,
    private categoriesService: CategoriesService
  ) {}

  ngOnInit(): void {
    this.productsService.getAll().subscribe({
      next: (data) => {
        this.products.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load products.');
        this.loading.set(false);
      }
    });

    this.categoriesService.getAll().subscribe({
      next: (data) => this.categories.set(data),
      error: () => this.formMessage.set('Failed to load categories.')
    });
  }

  formatMoney(value: number) {
    return this.money.format(value);
  }

  trackById(_: number, product: ProductDto) {
    return product.id;
  }

  toggleForm() {
    this.showForm.update((value) => !value);
    this.formMessage.set(null);
  }

  submitProduct() {
    this.formMessage.set(null);

    if (!this.newProduct.name.trim()) {
      this.formMessage.set('Product name is required.');
      return;
    }

    if (!this.newProduct.categoryId) {
      this.formMessage.set('Select a category.');
      return;
    }

    this.creating.set(true);
    this.productsService.create(this.newProduct).subscribe({
      next: (created) => {
        this.products.set([created, ...this.products()]);
        this.newProduct = { name: '', price: 0, stock: 0, categoryId: 0 };
        this.creating.set(false);
        this.formMessage.set('Product added.');
      },
      error: (err) => {
        this.creating.set(false);
        this.formMessage.set(err?.error?.message || 'Unable to create product.');
      }
    });
  }

  submitCategory() {
    this.formMessage.set(null);

    if (!this.newCategory.name.trim()) {
      this.formMessage.set('Category name is required.');
      return;
    }

    this.categoriesService.create(this.newCategory).subscribe({
      next: (created) => {
        this.categories.set([...this.categories(), created]);
        this.newCategory = { name: '' };
        this.formMessage.set('Category added.');
      },
      error: (err) => {
        this.formMessage.set(err?.error?.message || 'Unable to create category.');
      }
    });
  }

  startEdit(product: ProductDto) {
    this.editingId.set(product.id);
    this.editProduct = {
      name: product.name,
      price: product.price,
      stock: product.stock,
      categoryId: product.categoryId
    };
    this.editMessage.set(null);
  }

  cancelEdit() {
    this.editingId.set(null);
    this.editMessage.set(null);
  }

  saveEdit(product: ProductDto) {
    this.editMessage.set(null);

    if (!this.editProduct.name.trim()) {
      this.editMessage.set('Product name is required.');
      return;
    }

    if (!this.editProduct.categoryId) {
      this.editMessage.set('Select a category.');
      return;
    }

    if (this.editProduct.stock < 0) {
      this.editMessage.set('Stock cannot be negative.');
      return;
    }

    this.savingEdit.set(true);
    this.productsService.update(product.id, this.editProduct).subscribe({
      next: () => {
        const categoryName =
          this.categories().find((c) => c.id === this.editProduct.categoryId)?.name ??
          product.categoryName ??
          null;
        const updated: ProductDto = {
          ...product,
          ...this.editProduct,
          categoryName
        };
        this.products.update((items) =>
          items.map((item) => (item.id === product.id ? updated : item))
        );
        this.savingEdit.set(false);
        this.editingId.set(null);
      },
      error: (err) => {
        this.savingEdit.set(false);
        this.editMessage.set(err?.error?.message || 'Unable to update product.');
      }
    });
  }
}
