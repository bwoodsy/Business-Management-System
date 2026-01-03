import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CategoriesService } from '../../services/categories';
import { CustomersService } from '../../services/customers.service';
import { ProductsService } from '../../services/products.service';
import { RepairJobsService } from '../../services/repair-jobs.service';
import { CategoryDto, CreateCategoryDto } from '../../models/category';
import { CreateCustomerDto, CustomerDto } from '../../models/customer';
import { CreateProductDto, ProductDto } from '../../models/product';
import { CreateRepairJobDto, RepairJobDto, UpdateRepairJobStatusDto } from '../../models/repair-job';
import { catchError, finalize, map } from 'rxjs/operators';
import { of } from 'rxjs';

type JobItemForm = {
  productId: number | null;
  quantity: number;
};

type JobStatus = 'New' | 'In Progress' | 'Waiting Parts' | 'Ready' | 'Completed';

const JOB_STATUSES: { key: JobStatus; label: string }[] = [
  { key: 'New', label: 'New' },
  { key: 'In Progress', label: 'In Progress' },
  { key: 'Waiting Parts', label: 'Waiting Parts' },
  { key: 'Ready', label: 'Ready' },
  { key: 'Completed', label: 'Completed' }
];

const STATUS_MAP: Record<string, JobStatus> = {
  'new': 'New',
  'in progress': 'In Progress',
  'waiting parts': 'Waiting Parts',
  'ready': 'Ready',
  'completed': 'Completed'
};

@Component({
  selector: 'app-jobs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './jobs.html',
  styleUrls: ['./jobs.css']
})
export class JobsComponent implements OnInit {
  jobs: RepairJobDto[] = [];
  products: ProductDto[] = [];
  categories: CategoryDto[] = [];
  customers: CustomerDto[] = [];
  loading = true;
  error: string | null = null;
  creating = false;
  updating = false;
  draggingId: number | null = null;
  dragOverStatus: JobStatus | null = null;
  archiveSort: 'recent' | 'profit' | 'sale' = 'recent';
  groupedJobs: Record<JobStatus, RepairJobDto[]> = {
    'New': [],
    'In Progress': [],
    'Waiting Parts': [],
    'Ready': [],
    'Completed': []
  };

  newJob: CreateRepairJobDto = {
    customerId: null,
    salePrice: 0,
    notes: '',
    items: []
  };
  jobItems: JobItemForm[] = [{ productId: null, quantity: 1 }];

  newProduct: CreateProductDto = {
    name: '',
    price: 0,
    stock: 0,
    categoryId: 0
  };
  newCategory: CreateCategoryDto = {
    name: ''
  };
  newCustomer: CreateCustomerDto = {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: ''
  };
  formMessage: string | null = null;

  private readonly money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  readonly statuses = JOB_STATUSES;

  constructor(
    private jobsService: RepairJobsService,
    private productsService: ProductsService,
    private categoriesService: CategoriesService,
    private customersService: CustomersService,
    private changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll() {
    this.loading = true;
    this.error = null;

    this.jobsService
      .getAll()
      .pipe(
        map((jobs) => jobs.map((job) => this.normalizeJob(job))),
        catchError(() => {
          this.error = 'Failed to load jobs.';
          return of([] as RepairJobDto[]);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((jobs) => {
        this.jobs = jobs;
        this.rebuildColumns();
        this.changeDetector.detectChanges();
      });

    this.productsService.getAll().subscribe({
      next: (products) => (this.products = products),
      error: () => (this.formMessage = 'Failed to load products list.')
    });

    this.categoriesService.getAll().subscribe({
      next: (categories) => (this.categories = categories),
      error: () => (this.formMessage = 'Failed to load categories list.')
    });

    this.customersService.getAll().subscribe({
      next: (customers) => (this.customers = customers),
      error: () => (this.formMessage = 'Failed to load customers list.')
    });
  }

  addItemRow() {
    this.jobItems = [...this.jobItems, { productId: null, quantity: 1 }];
  }

  removeItemRow(index: number) {
    this.jobItems = this.jobItems.filter((_, i) => i !== index);
  }

  submitJob() {
    this.formMessage = null;

    const items = this.jobItems
      .filter((item) => !!item.productId && item.quantity > 0)
      .map((item) => ({ productId: item.productId as number, quantity: item.quantity }));

    if (!this.newJob.salePrice || this.newJob.salePrice <= 0) {
      this.formMessage = 'Sale price must be greater than 0.';
      return;
    }

    if (items.length === 0) {
      this.formMessage = 'Add at least one product line item.';
      return;
    }

    const payload: CreateRepairJobDto = {
      customerId: this.newJob.customerId || null,
      salePrice: this.newJob.salePrice,
      notes: this.newJob.notes ?? null,
      items
    };

    this.creating = true;
    this.jobsService.create(payload).subscribe({
      next: (created) => {
        this.jobs = [created, ...this.jobs];
        this.rebuildColumns();
        this.creating = false;
        this.newJob = { customerId: null, salePrice: 0, notes: '', items: [] };
        this.jobItems = [{ productId: null, quantity: 1 }];
        this.formMessage = 'Job created.';
        this.loadAll();
      },
      error: (err) => {
        this.creating = false;
        this.formMessage = err?.error?.message || 'Unable to create job.';
      }
    });
  }

  submitProduct() {
    this.formMessage = null;

    if (!this.newProduct.name.trim()) {
      this.formMessage = 'Product name is required.';
      return;
    }

    if (!this.newProduct.categoryId) {
      this.formMessage = 'Select a category for the product.';
      return;
    }

    this.productsService.create(this.newProduct).subscribe({
      next: (created) => {
        this.products = [...this.products, created];
        this.newProduct = { name: '', price: 0, stock: 0, categoryId: 0 };
        this.formMessage = 'Product added.';
      },
      error: (err) => {
        this.formMessage = err?.error?.message || 'Unable to create product.';
      }
    });
  }

  submitCategory() {
    this.formMessage = null;

    if (!this.newCategory.name.trim()) {
      this.formMessage = 'Category name is required.';
      return;
    }

    this.categoriesService.create(this.newCategory).subscribe({
      next: (created) => {
        this.categories = [...this.categories, created];
        this.newCategory = { name: '' };
        this.formMessage = 'Category added.';
      },
      error: (err) => {
        this.formMessage = err?.error?.message || 'Unable to create category.';
      }
    });
  }

  updateJobStatus(job: RepairJobDto, status: JobStatus, isReturnedToCustomer?: boolean) {
    const payload: UpdateRepairJobStatusDto = {
      status,
      isReturnedToCustomer
    };

    this.updating = true;
    this.jobsService.updateStatus(job.id, payload).subscribe({
      next: () => {
        job.status = status;
        job.isReturnedToCustomer = isReturnedToCustomer ?? job.isReturnedToCustomer;
        if (status === 'Completed' && !job.completedAt) {
          job.completedAt = new Date().toISOString();
        }
        if (status !== 'Completed') {
          job.completedAt = null;
          job.isReturnedToCustomer = false;
          job.returnedAt = null;
        }
        if (isReturnedToCustomer === true) {
          job.returnedAt = new Date().toISOString();
        }
        this.rebuildColumns();
        this.updating = false;
      },
      error: (err) => {
        this.updating = false;
        this.formMessage = err?.error?.message || 'Unable to update job status.';
      }
    });
  }

  jobsByStatus(status: JobStatus) {
    return this.groupedJobs[status] ?? [];
  }

  onDragStart(job: RepairJobDto) {
    this.draggingId = job.id;
  }

  onDragOver(event: DragEvent, status: JobStatus) {
    event.preventDefault();
    this.dragOverStatus = status;
  }

  onDragLeave() {
    this.dragOverStatus = null;
  }

  onDrop(event: DragEvent, status: JobStatus) {
    event.preventDefault();
    this.dragOverStatus = null;
    if (this.draggingId == null) return;

    const job = this.jobs.find((item) => item.id === this.draggingId);
    this.draggingId = null;
    if (!job || job.status === status) return;

    this.updateJobStatus(job, status);
  }

  markReturned(job: RepairJobDto) {
    this.updateJobStatus(job, 'Completed', true);
  }

  archiveJobs() {
    const completed = this.jobs.filter((job) => job.status === 'Completed');
    const sorted = [...completed];

    switch (this.archiveSort) {
      case 'profit':
        return sorted.sort((a, b) => b.profit - a.profit);
      case 'sale':
        return sorted.sort((a, b) => b.salePrice - a.salePrice);
      default:
        return sorted.sort((a, b) => {
          const aTime = a.completedAt ? Date.parse(a.completedAt) : Date.parse(a.createdAt);
          const bTime = b.completedAt ? Date.parse(b.completedAt) : Date.parse(b.createdAt);
          return bTime - aTime;
        });
    }
  }

  submitCustomer() {
    this.formMessage = null;

    if (!this.newCustomer.firstName.trim()) {
      this.formMessage = 'Customer first name is required.';
      return;
    }

    this.customersService.create(this.newCustomer).subscribe({
      next: (created) => {
        this.customers = [...this.customers, created];
        this.newCustomer = { firstName: '', lastName: '', email: '', phoneNumber: '' };
        this.newJob.customerId = created.id;
        this.formMessage = 'Customer added.';
      },
      error: (err) => {
        this.formMessage = err?.error?.message || 'Unable to create customer.';
      }
    });
  }

  trackJob(_: number, job: RepairJobDto) {
    return job.id;
  }

  formatMoney(value: number) {
    return this.money.format(value);
  }

  getProductName(productId: number) {
    return this.products.find((p) => p.id === productId)?.name ?? 'Unknown';
  }

  calculateLineCost(item: JobItemForm) {
    if (!item.productId) return 0;
    const product = this.products.find((p) => p.id === item.productId);
    if (!product) return 0;
    return product.price * item.quantity;
  }

  private normalizeJob(job: RepairJobDto): RepairJobDto {
    return {
      ...job,
      status: this.normalizeStatus(job.status),
      isReturnedToCustomer: job.isReturnedToCustomer ?? false
    };
  }

  private normalizeStatus(status?: string | null): JobStatus {
    if (!status) return 'New';
    const normalized = status.trim().toLowerCase();
    return STATUS_MAP[normalized] ?? 'New';
  }

  private rebuildColumns() {
    const grouped: Record<JobStatus, RepairJobDto[]> = {
      'New': [],
      'In Progress': [],
      'Waiting Parts': [],
      'Ready': [],
      'Completed': []
    };

    for (const job of this.jobs) {
      const status = this.normalizeStatus(job.status);
      grouped[status].push(job);
    }

    this.groupedJobs = grouped;
  }
}
