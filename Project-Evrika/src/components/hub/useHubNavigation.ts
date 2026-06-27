/**
 * useHubNavigation — scene-to-room mapping for in-hub navigation.
 *
 * Responsibility: createHubNavigate maps SceneId to hub tabs or delegates to App router.
 * Docs: docs/architecture/routing-and-scenes.md
 */

import { useCallback } from 'react'
import type { SceneId } from '../../types/sceneId'
import type { NavRoomId } from '../../lib/hubRooms'

export type RoomId = NavRoomId

const SCENE_TO_ROOM: Partial<Record<SceneId, RoomId>> = {
  weigh: 'weigh',
  melt: 'furnace',
  waterDiscovery: 'waterLab',
  displacement: 'overflow',
  finale: 'throne',
}

export function createHubNavigate(
  switchRoom: (room: RoomId) => void,
  onNavigate: (scene: SceneId) => void,
) {
  return (scene: SceneId) => {
    const mapped = SCENE_TO_ROOM[scene]
    if (mapped) {
      switchRoom(mapped)
    } else {
      onNavigate(scene)
    }
  }
}

export function useHubNavigate(
  switchRoom: (room: RoomId) => void,
  onNavigate: (scene: SceneId) => void,
) {
  return useCallback(
    (scene: SceneId) => createHubNavigate(switchRoom, onNavigate)(scene),
    [onNavigate, switchRoom],
  )
}
