import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InlineEvidenceListComponent } from './inline-evidence-list.component';
import { EvidenceDetailDto } from '../../../../evidence/models/evidence.model';

const MOCK_FILES: EvidenceDetailDto[] = [
  {
    evidenceId: 1, evidenceTypeId: 1,
    fileName: 'collection_report.pdf', evidenceType: 'Collection Report',
    siteTag: 'Site A', uploadedBy: 'Sarah Chen', uploadedDate: '15 Aug 2025', status: 'complete',
  },
  {
    evidenceId: 2, evidenceTypeId: 2,
    fileName: 'site_photo.jpg', evidenceType: 'Site Photo',
    uploadedBy: 'Local Partner', uploadedDate: '18 Sep 2025', status: 'pending',
  },
];

describe('InlineEvidenceListComponent', () => {
  let fixture: ComponentFixture<InlineEvidenceListComponent>;
  let component: InlineEvidenceListComponent;

  const create = async (files: EvidenceDetailDto[], evidenceRequired = 3) => {
    await TestBed.configureTestingModule({
      imports: [InlineEvidenceListComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(InlineEvidenceListComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('items', files);
    fixture.componentRef.setInput('evidenceRequired', evidenceRequired);
    fixture.detectChanges();
  };

  it('renders one row per item', async () => {
    await create(MOCK_FILES);
    expect(fixture.nativeElement.querySelectorAll('[data-file-row]').length).toBe(2);
  });

  it('shows empty state when items is empty', async () => {
    await create([]);
    expect(fixture.nativeElement.textContent).toContain('No evidence yet');
  });

  it('renders file name', async () => {
    await create([MOCK_FILES[0]]);
    expect(fixture.nativeElement.textContent).toContain('collection_report.pdf');
  });

  it('renders evidence type', async () => {
    await create([MOCK_FILES[0]]);
    expect(fixture.nativeElement.textContent).toContain('Collection Report');
  });

  it('renders site tag when present', async () => {
    await create([MOCK_FILES[0]]);
    expect(fixture.nativeElement.textContent).toContain('Site A');
  });

  it('shows uploaded/required count in header', async () => {
    await create(MOCK_FILES, 5);
    // 2 files uploaded, 5 required
    expect(fixture.nativeElement.textContent).toContain('2/5');
  });

  it('shows complete count', async () => {
    await create(MOCK_FILES);
    // 1 complete out of 2
    expect(fixture.nativeElement.textContent).toContain('1/2 complete');
  });

  it('toggles status locally when status button clicked', async () => {
    await create([MOCK_FILES[1]]); // starts as pending
    const btn = fixture.nativeElement.querySelector('[data-file-row] button');
    expect(btn.textContent.trim()).toContain('Pending');
    btn.click();
    fixture.detectChanges();
    expect(btn.textContent.trim()).toContain('Complete');
  });
});
