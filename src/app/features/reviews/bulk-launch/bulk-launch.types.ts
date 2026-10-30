import { BulkProject } from '../../admin/models/project.model';
// import { BulkProject } from '../../../admin/models/project.model';

export interface BulkLaunchRow extends BulkProject {
  selected: boolean;
}
