/**
 * SceneId — top-level app navigation union.
 *
 * Responsibility: single shared type for App routing and scene `onNavigate` props.
 * Docs: docs/architecture/routing-and-scenes.md
 */

export type SceneId =
  | 'landing'
  | 'intro'
  | 'hub'
  | 'bathStory'
  | 'weigh'
  | 'melt'
  | 'waterDiscovery'
  | 'displacement'
  | 'finale'
  | 'practice'
  | 'bath'
  | 'crown'
  | 'recap'
