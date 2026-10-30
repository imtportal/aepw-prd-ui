import { ReviewWorkflowStage } from "../../reviews/models/review.model";

export const mapStageToFormattedKeys = (input: Record<ReviewWorkflowStage, string>) => {
  const output: Record<ReviewWorkflowStage, string> = {};

  const keys: string[] = Object.keys(input);

  for (const key of keys) {
    output[key] = input[key];
    
    output[key.toLowerCase()] = input[key];
    output[key.toUpperCase()] = input[key];

    output[key.replaceAll(" ", "").toLowerCase()] = input[key];
    output[key.replaceAll(" ", "").toUpperCase()] = input[key];
  }

  return output;
}
enum Color_Codes {
  Orange = 'bg-[hsl(var(--aepw-orange)/0.12)] text-[hsl(var(--aepw-orange))]',
  AccentGreen = 'bg-[hsl(var(--aepw-accent-green)/0.15)] text-[hsl(var(--aepw-green))]',
  DarkGrey = 'bg-[hsl(var(--aepw-dark-grey)/0.12)] text-[hsl(var(--aepw-dark-grey))]',
  LightBlue = 'bg-[hsl(var(--aepw-light-blue)/0.25)] text-[hsl(var(--aepw-blue))]',
  Green = 'bg-[hsl(var(--aepw-green)/0.15)] text-[hsl(var(--aepw-green))]',
  Muted = 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]',
  Blue = 'bg-[hsl(var(--aepw-blue)/0.12)] text-[hsl(var(--aepw-blue))]',
  AccentGreenLightGreenText = 'bg-[hsl(var(--aepw-accent-green)/0.15)] text-green-600'
}
export const STAGE_COLORS: Record<ReviewWorkflowStage, string> = mapStageToFormattedKeys({
  'Due':                     Color_Codes.Muted,
  'Draft':                   Color_Codes.Blue,
  // 'DATACOLLECTION':         'bg-[hsl(var(--aepw-accent-green)/0.15)] text-[hsl(var(--aepw-green))]',
  'Data Collection':         Color_Codes.AccentGreen,
  'Data Collection / Evidence Collection':         Color_Codes.AccentGreen,
  'Evidence Collection':     Color_Codes.AccentGreenLightGreenText,
  'RISKADJUSTMENT': Color_Codes.Orange,
  'Risk Adjustment': Color_Codes.Orange,
  'Validation':              Color_Codes.LightBlue,
  'Approval':                Color_Codes.Green,
  'Closed':                  Color_Codes.DarkGrey,
  'Risk Adjustment Pending':  Color_Codes.Orange,

  'Pending Risk Adjust':  Color_Codes.Orange,
  // 'PendingRiskAdjust':    Color_Codes.Orange,
  // 'PENDINGRISKADJUST':    Color_Codes.Orange,
  
  'Pending Review Launch': Color_Codes.Green,
  // 'PendingReviewLaunch': Color_Codes.Green,
  // 'PENDINGREVIEWLAUNCH': Color_Codes.Green,
  
  'Risk Adjustment Reviewed': Color_Codes.Green,
});

export const getUpperCasedWithoutSpaceStages = () => {
    const keys = Object.keys(STAGE_COLORS);
    const output: Record<string, string> = {};

    for (const key of keys) {
      const ultimateKey = key.replaceAll(" ", "").toUpperCase();

      output[key] = ultimateKey;
      
      output[key.toLowerCase()] = ultimateKey;
      output[key.toUpperCase()] = ultimateKey;

      output[key.replaceAll(" ", "").toLowerCase()] = ultimateKey;
      output[key.replaceAll(" ", "").toUpperCase()] = ultimateKey;


    }

    // setInterval(() => {
    //   console.log("Ultimate Keys", output)
    // }, 3000);
    return output;
  }
  export const upperCasedWithoutSpaceStages = getUpperCasedWithoutSpaceStages();

export const METRIC_CATEGORIES = [
  { code: 'MW', name: 'Reduce Unmanaged Waste', projects: 18, total: '42,500 tonnes' },
  { code: 'CV', name: 'Capture Value',           projects: 12, total: '$8.2M'         },
  { code: 'EE', name: 'Enable Ecosystem',         projects: 22, total: '150 programs'  },
  { code: 'MC', name: 'Mobilise Capital',         projects:  8, total: '$125M'         },
  { code: 'SB', name: 'Social Benefit',           projects: 15, total: '28,000 people' },
];

