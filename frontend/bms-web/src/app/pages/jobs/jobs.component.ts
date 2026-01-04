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
import { CreateRepairJobDto, RepairJobDto, UpdateRepairJobDto, UpdateRepairJobStatusDto } from '../../models/repair-job';
import { catchError, finalize, map } from 'rxjs/operators';
import { of } from 'rxjs';

type JobItemForm = {
  productId: number | null;
  quantity: number;
};

type JobStatus = 'New' | 'Waiting Parts' | 'In Progress' | 'Completed';

const JOB_STATUSES: { key: JobStatus; label: string }[] = [
  { key: 'New', label: 'New' },
  { key: 'Waiting Parts', label: 'Waiting Parts' },
  { key: 'In Progress', label: 'In Progress' },
  { key: 'Completed', label: 'Completed' }
];

const STATUS_MAP: Record<string, JobStatus> = {
  'new': 'New',
  'in progress': 'In Progress',
  'waiting parts': 'Waiting Parts',
  'ready': 'In Progress',
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
  editingId: number | null = null;
  savingEdit = false;
  editMessage: string | null = null;
  isDragging = false;
  editItems: JobItemForm[] = [];
  groupedJobs: Record<JobStatus, RepairJobDto[]> = {
    'New': [],
    'Waiting Parts': [],
    'In Progress': [],
    'Completed': []
  };
  editJob: UpdateRepairJobDto = {
    customerId: null,
    salePrice: 0,
    notes: ''
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
    const previous = {
      status: job.status,
      completedAt: job.completedAt,
      isReturnedToCustomer: job.isReturnedToCustomer,
      returnedAt: job.returnedAt
    };
    const payload: UpdateRepairJobStatusDto = {
      status,
      isReturnedToCustomer
    };

    this.applyJobStatus(job, status, isReturnedToCustomer);
    this.rebuildColumns();
    this.updating = true;
    this.jobsService.updateStatus(job.id, payload).subscribe({
      next: () => {
        this.updating = false;
      },
      error: (err) => {
        this.updating = false;
        job.status = previous.status;
        job.completedAt = previous.completedAt;
        job.isReturnedToCustomer = previous.isReturnedToCustomer;
        job.returnedAt = previous.returnedAt;
        this.rebuildColumns();
        this.formMessage = err?.error?.message || 'Unable to update job status.';
      }
    });
  }

  jobsByStatus(status: JobStatus) {
    return this.groupedJobs[status] ?? [];
  }

  onDragStart(job: RepairJobDto) {
    this.draggingId = job.id;
    this.isDragging = true;
  }

  onDragEnd() {
    this.draggingId = null;
    this.isDragging = false;
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

  startEdit(job: RepairJobDto, event?: MouseEvent) {
    if (event) event.stopPropagation();
    if (this.isDragging) return;
    if (this.editingId === job.id) {
      this.cancelEdit();
      return;
    }
    this.editingId = job.id;
    this.editJob = {
      customerId: job.customerId ?? null,
      salePrice: job.salePrice,
      notes: job.notes ?? ''
    };
    this.editItems =
      job.items.length > 0
        ? job.items.map((item) => ({ productId: item.productId, quantity: item.quantity }))
        : [{ productId: null, quantity: 1 }];
    this.editMessage = null;
  }

  cancelEdit() {
    this.editingId = null;
    this.editMessage = null;
    this.editItems = [];
  }

  saveEdit(job: RepairJobDto) {
    this.editMessage = null;

    const items = this.editItems
      .filter((item) => !!item.productId && item.quantity > 0)
      .map((item) => ({ productId: item.productId as number, quantity: item.quantity }));

    if (!this.editJob.salePrice || this.editJob.salePrice <= 0) {
      this.editMessage = 'Sale price must be greater than 0.';
      return;
    }

    if (items.length === 0) {
      this.editMessage = 'Add at least one product line item.';
      return;
    }

    this.savingEdit = true;
    const payload: UpdateRepairJobDto = {
      ...this.editJob,
      items
    };
    this.jobsService.update(job.id, payload).subscribe({
      next: (updated) => {
        job.customerId = updated.customerId;
        job.customerName = updated.customerName;
        job.salePrice = updated.salePrice;
        job.notes = updated.notes;
        job.items = updated.items;
        job.partsCost = updated.partsCost;
        job.profit = updated.profit;
        this.savingEdit = false;
        this.editingId = null;
        this.editItems = [];
      },
      error: (err) => {
        this.savingEdit = false;
        this.editMessage = err?.error?.message || 'Unable to update job.';
      }
    });
  }

  addEditItemRow() {
    this.editItems = [...this.editItems, { productId: null, quantity: 1 }];
  }

  removeEditItemRow(index: number) {
    this.editItems = this.editItems.filter((_, i) => i !== index);
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
      'Waiting Parts': [],
      'In Progress': [],
      'Completed': []
    };

    for (const job of this.jobs) {
      const status = this.normalizeStatus(job.status);
      grouped[status].push(job);
    }

    this.groupedJobs = grouped;
  }

  private applyJobStatus(job: RepairJobDto, status: JobStatus, isReturnedToCustomer?: boolean) {
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
  }
}
