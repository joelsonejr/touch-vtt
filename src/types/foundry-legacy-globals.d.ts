// This module supports Foundry v11-v14 at the same time. fvtt-types only models the
// current (v13+) namespaced API (`foundry.canvas.interaction.MouseInteractionManager`, etc),
// not the bare globals Foundry exposed directly pre-v13. These declarations are intentionally
// loose (`any`) - they only exist so legacy code paths type-check, not to give real safety there.

declare let MouseInteractionManager: any
declare const TokenHUD: any
declare const KeyboardManager: any
declare const DragDrop: any
declare const Ruler: any
declare const TemplateLayer: any
declare const MeasuredTemplate: any
declare const Application: any
declare const FormApplication: any
declare function expandObject(obj: object): object
