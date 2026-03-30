import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ResourceService } from '../../core/services/resource.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { ViewStateService } from '../../core/services/view-state.service';
import { Resource } from '../../shared/models/resource.model';
import { SchoolClass } from '../../shared/models/class.model';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { ResourceCardComponent } from '../../components/resource-card/resource-card.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { RequestStateStore } from '../../shared/state/request-state.store';

@Component({
  selector: 'app-resources',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, ResourceCardComponent, ConfirmModalComponent],
  providers: [RequestStateStore],
  templateUrl: './resources.component.html',
  styleUrl: './resources.component.css'
})
export class ResourcesComponent implements OnInit, OnDestroy {
  private readonly resourceService = inject(ResourceService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly viewState = inject(ViewStateService);
  private readonly sanitizer = inject(DomSanitizer);
  readonly uploadState = inject(RequestStateStore);

  get resources(): Resource[] {
    return this.viewState.resources();
  }

  get isAdmin(): boolean {
    return this.authService.role() === 'ADMIN';
  }

  get loading(): boolean {
    return this.viewState.resourcesLoading();
  }

  get error(): string {
    return this.viewState.resourcesError();
  }

  get classOptions(): SchoolClass[] {
    return this.viewState.classes();
  }

  showUploadForm = false;

  previewOpen = false;
  previewTitle = '';
  previewUrl = '';
  previewResourceUrl: SafeResourceUrl | null = null;
  previewMode: 'pdf' | 'image' | 'none' = 'none';
  private activeBlobUrl: string | null = null;

  newTitle = '';
  newClassRoomId: number | null = null;
  newIsOfficial = false;
  selectedFile: File | null = null;
  showDeleteConfirm = false;
  pendingDeleteResource: Resource | null = null;

  ngOnInit(): void {
    this.loadResources();
    this.viewState.loadClasses();
  }

  loadResources(force = false): void {
    this.viewState.loadResources(force);
  }

  ngOnDestroy(): void {
    this.revokePreviewUrl();
  }

  toggleUploadForm(): void {
    this.showUploadForm = !this.showUploadForm;
    if (!this.showUploadForm) {
      this.uploadState.clearError();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input?.files?.[0] ?? null;
  }

  submitUpload(): void {
    if (!this.newTitle.trim() || !this.selectedFile || this.uploadState.loading()) return;

    this.uploadState.run(this.resourceService.uploadResourceFile(
      this.selectedFile,
      this.newTitle.trim(),
      {
        classRoomId: this.newClassRoomId ?? undefined,
        isOfficial: this.newIsOfficial
      }
    )).subscribe({
      next: () => {
        this.newTitle = '';
        this.newClassRoomId = null;
        this.newIsOfficial = false;
        this.selectedFile = null;
        this.showUploadForm = false;
        this.uploadState.clearError();
        this.toast.success('Resource uploaded successfully.');
        this.loadResources(true);
      },
      error: (err) => {
        const msg = err?.error?.message || err?.error?.detail || 'Failed to upload resource.';
        this.uploadState.setError(msg);
        this.toast.error(msg);
      }
    });
  }

  viewFile(resource: Resource): void {
    const id = Number(resource.id);
    if (!id) {
      this.toast.error('Invalid resource identifier.');
      return;
    }

    this.resourceService.getResourceDetails(id).subscribe({
      next: (details) => {
        const directUrl = this.resolveDirectFileUrl(details.fileReadUrl || details.fileUrl);

        this.resourceService.getResourceFileBlob(id).subscribe({
          next: (response) => {
            const blob = response.body;
            if (!blob) {
              this.toast.error('Failed to read resource file.');
              return;
            }

            const contentType = (response.headers.get('content-type') || '').toLowerCase();
            const disposition = response.headers.get('content-disposition') || '';
            const filename = this.extractFilename(disposition)
              || details.originalFilename
              || `resource-${id}`;
            const previewKind = this.resolvePreviewType(contentType, filename, details.fileType);

            if (previewKind !== 'none') {
              this.revokePreviewUrl();
              const normalizedType = previewKind === 'pdf' ? 'application/pdf' : (contentType || 'image/*');
              const normalizedBlob = blob.type ? blob : new Blob([blob], { type: normalizedType });
              const url = URL.createObjectURL(normalizedBlob);
              this.activeBlobUrl = url;
              this.previewUrl = url;
              this.previewResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
              this.previewMode = previewKind;
              this.previewTitle = details.title;
              this.previewOpen = true;
              return;
            }

            this.downloadBlob(blob, filename);
          },
          error: (err) => {
            if (err?.status === 404) {
              if (directUrl) {
                this.fetchDirectUrlWithAuth(directUrl, details.title, details.originalFilename || `resource-${id}`);
                return;
              }
              this.toast.error('Original file not available for this resource.');
              return;
            }
            this.toast.error('Unable to read original file.');
          }
        });
      },
      error: () => {
        this.toast.error('Unable to load resource details.');
      }
    });
  }

  requestDeleteResource(resource: Resource): void {
    this.pendingDeleteResource = resource;
    this.showDeleteConfirm = true;
  }

  cancelDeleteResource(): void {
    this.showDeleteConfirm = false;
    this.pendingDeleteResource = null;
  }

  confirmDeleteResource(): void {
    const resource = this.pendingDeleteResource;
    if (!resource) return;

    const resourceId = resource.id;
    const id = Number(resourceId);
    if (!id) {
      this.cancelDeleteResource();
      return;
    }

    this.resourceService.delete(id).subscribe({
      next: () => {
        this.toast.success('Resource deleted successfully.');
        this.cancelDeleteResource();
        this.loadResources(true);
      },
      error: (err) => {
        const msg = err?.error?.message || err?.error?.detail || 'Failed to delete resource.';
        this.toast.error(msg);
        this.cancelDeleteResource();
      }
    });
  }

  closePreview(): void {
    this.previewOpen = false;
    this.previewMode = 'none';
    this.previewTitle = '';
    this.revokePreviewUrl();
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  private extractFilename(contentDisposition: string): string | null {
    const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition);
    if (utf8Match?.[1]) {
      return decodeURIComponent(utf8Match[1]);
    }
    const asciiMatch = /filename="?([^";]+)"?/i.exec(contentDisposition);
    return asciiMatch?.[1] ?? null;
  }

  private resolvePreviewType(contentType: string, filename: string, fileType: string | null): 'pdf' | 'image' | 'none' {
    const lowerType = (contentType || '').toLowerCase();
    const lowerName = (filename || '').toLowerCase();
    const lowerFileType = (fileType || '').toLowerCase();

    if (lowerType.includes('pdf') || lowerName.endsWith('.pdf') || lowerFileType.includes('pdf')) {
      return 'pdf';
    }

    if (lowerType.startsWith('image/') || /\.(png|jpg|jpeg|gif|bmp|webp|svg)$/.test(lowerName) || lowerFileType.startsWith('image/')) {
      return 'image';
    }

    return 'none';
  }

  private resolveDirectFileUrl(url: string | null | undefined): string | null {
    if (!url || !url.trim()) {
      return null;
    }

    const trimmed = url.trim();
    if (trimmed.startsWith('storage://')) {
      // Internal storage URI; must be accessed via backend API proxy endpoints.
      return null;
    }

    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }

    if (trimmed.startsWith('/')) {
      return `http://localhost:8080${trimmed}`;
    }

    return `http://localhost:8080/${trimmed}`;
  }

  private fetchDirectUrlWithAuth(url: string, fallbackTitle: string, fallbackFilename: string): void {
    this.resourceService.getFileBlobByUrl(url).subscribe({
      next: (response) => {
        const blob = response.body;
        if (!blob) {
          this.toast.error('Unable to read resource file.');
          return;
        }

        const contentType = (response.headers.get('content-type') || '').toLowerCase();
        const disposition = response.headers.get('content-disposition') || '';
        const filename = this.extractFilename(disposition)
          || this.extractFilenameFromUrl(url)
          || fallbackFilename;
        const previewKind = this.resolvePreviewType(contentType, filename, null);

        if (previewKind !== 'none') {
          this.revokePreviewUrl();
          const normalizedType = previewKind === 'pdf' ? 'application/pdf' : (contentType || 'image/*');
          const normalizedBlob = blob.type ? blob : new Blob([blob], { type: normalizedType });
          const objectUrl = URL.createObjectURL(normalizedBlob);
          this.activeBlobUrl = objectUrl;
          this.previewUrl = objectUrl;
          this.previewResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(objectUrl);
          this.previewMode = previewKind;
          this.previewTitle = fallbackTitle || filename;
          this.previewOpen = true;
          return;
        }

        this.downloadBlob(blob, filename);
      },
      error: (err) => {
        const msg = err?.status === 403
          ? 'Access denied for this file.'
          : 'Unable to open resource file.';
        this.toast.error(msg);
      }
    });
  }

  private extractFilenameFromUrl(url: string): string | null {
    const cleaned = url.split('?')[0];
    const parts = cleaned.split('/');
    const last = parts[parts.length - 1];
    return last ? decodeURIComponent(last) : null;
  }

  private revokePreviewUrl(): void {
    if (this.activeBlobUrl) {
      URL.revokeObjectURL(this.activeBlobUrl);
      this.activeBlobUrl = null;
    }
    this.previewUrl = '';
    this.previewResourceUrl = null;
  }
}
