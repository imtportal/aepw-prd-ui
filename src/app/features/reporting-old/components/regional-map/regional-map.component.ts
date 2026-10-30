import { Component, input, output } from '@angular/core';
import { Program } from '../../models/reporting.modelold';

interface MapRegion {
  id:    string;
  name:  string;
  cx:    number;
  cy:    number;
  r:     number;
  color: string;
  isHQ?: boolean;
}

@Component({
  selector: 'app-regional-map',
  standalone: true,
  templateUrl: './regional-map.component.html',
})
export class RegionalMapComponent {
  programs        = input<Program[]>([]);
  programSelected = output<string>();

  protected readonly regions: MapRegion[] = [
    { id: 'india',     name: 'India',         cx: 120, cy: 95,  r: 18, color: '#E8862A' },
    { id: 'vietnam',   name: 'Vietnam',        cx: 210, cy: 90,  r: 14, color: '#8B5CF6' },
    { id: 'thailand',  name: 'Thailand',       cx: 185, cy: 100, r: 12, color: '#14B8A6' },
    { id: 'singapore', name: 'Singapore (HQ)', cx: 200, cy: 140, r: 6,  color: '#1e3a5f', isHQ: true },
    { id: 'indonesia', name: 'Indonesia',      cx: 230, cy: 165, r: 22, color: '#0077B6' },
    { id: 'brazil',    name: 'Brazil',         cx: 45,  cy: 175, r: 14, color: '#2E8B57' },
  ];

  protected readonly nonHqRegions = this.regions.filter(r => !r.isHQ);

  protected onRegionClick(region: MapRegion): void {
    if (!region.isHQ) {
      this.programSelected.emit(region.id);
    }
  }
}
