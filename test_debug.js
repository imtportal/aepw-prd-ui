// Quick test to understand the issue
const html = `
<div class="relative inline-block" (click)="$event.stopPropagation()">
  <div (click)="isOpen.set(!isOpen())">
    <ng-content select="[dropdownTrigger]" />
  </div>
  @if (isOpen()) {
    <div data-dropdown-menu ...>
      <ng-content select="[dropdownContent]" />
    </div>
  }
</div>
`;
console.log("Structure:");
console.log(html);
