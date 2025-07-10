# Firestore Database Schema - Club Management App

## マルチテナント構造

### 概要
各クラブが独立したテナントとして動作し、データが完全に分離される構造。

## Collection Structure

```
/clubs/{clubId}
├── name: string
├── description: string
├── ownerId: string (Firebase Auth UID)
├── createdAt: timestamp
├── updatedAt: timestamp
├── settings: {
│   ├── allowMemberRegistration: boolean
│   ├── timezone: string
│   └── defaultGroupId: string
│   }
│
├── /users/{userId}
│   ├── uid: string (Firebase Auth UID)
│   ├── name: string
│   ├── email: string
│   ├── role: string ("owner" | "admin" | "member")
│   ├── groupIds: array<string>
│   ├── joinedAt: timestamp
│   ├── isActive: boolean
│   └── profile: {
│       ├── avatar: string (URL)
│       ├── phone: string
│       └── bio: string
│       }
│
├── /groups/{groupId}
│   ├── name: string
│   ├── description: string
│   ├── color: string (hex color)
│   ├── createdAt: timestamp
│   ├── memberCount: number
│   └── isDefault: boolean
│
├── /events/{eventId}
│   ├── title: string
│   ├── description: string
│   ├── startDate: timestamp
│   ├── endDate: timestamp
│   ├── location: string
│   ├── targetGroupIds: array<string>
│   ├── createdBy: string (userId)
│   ├── createdAt: timestamp
│   ├── maxParticipants: number
│   ├── status: string ("draft" | "published" | "cancelled")
│   └── metadata: {
│       ├── type: string ("practice" | "match" | "meeting" | "social")
│       ├── isRecurring: boolean
│       └── recurrenceRule: string
│       }
│
├── /attendance/{eventId}
│   └── /responses/{userId}
│       ├── status: string ("attending" | "not_attending" | "maybe" | "no_response")
│       ├── respondedAt: timestamp
│       ├── comment: string
│       └── metadata: {
│           ├── respondedBy: string (userId)
│           └── notificationSent: boolean
│           }
│
├── /messages/{messageId}
│   ├── content: string
│   ├── authorId: string (userId)
│   ├── authorName: string
│   ├── targetGroupIds: array<string>
│   ├── createdAt: timestamp
│   ├── type: string ("announcement" | "general")
│   ├── priority: string ("low" | "normal" | "high" | "urgent")
│   ├── isRead: map<string, boolean> // userId -> isRead
│   └── metadata: {
│       ├── hasAttachment: boolean
│       ├── attachmentUrl: string
│       └── mentions: array<string> // mentioned userIds
│       }
│
├── /notifications/{notificationId}
│   ├── title: string
│   ├── body: string
│   ├── recipientIds: array<string>
│   ├── createdAt: timestamp
│   ├── scheduledFor: timestamp
│   ├── status: string ("pending" | "sent" | "failed")
│   ├── type: string ("event_reminder" | "message" | "system")
│   └── metadata: {
│       ├── relatedEntityId: string
│       ├── relatedEntityType: string ("event" | "message")
│       └── fcmTokens: array<string>
│       }
│
└── /analytics/{date}
    ├── date: string (YYYY-MM-DD)
    ├── activeUsers: number
    ├── eventsCreated: number
    ├── messagesCount: number
    ├── attendanceRate: number
    └── metadata: {
        ├── topGroups: array<{groupId: string, activityScore: number}>
        └── generatedAt: timestamp
        }
```

## Security Model

### ユーザーロール
- **Owner**: クラブ作成者、全権限
- **Admin**: オーナーが指定、管理権限（メンバー管理以外）
- **Member**: 一般メンバー、閲覧・出欠回答のみ

### アクセス権限
- 各クラブのデータは`clubId`で完全に分離
- ユーザーは所属クラブのデータのみアクセス可能
- オーナー・管理者のみがデータ作成・編集可能
- メンバーは読み取りと出欠回答のみ

## インデックス設計

### 複合インデックス
1. **clubs/{clubId}/events**: `targetGroupIds` + `startDate`
2. **clubs/{clubId}/messages**: `targetGroupIds` + `createdAt`
3. **clubs/{clubId}/users**: `groupIds` + `isActive`
4. **clubs/{clubId}/attendance**: `eventId` + `status`

### 単一フィールドインデックス
- `createdAt` (降順) - 全コレクション
- `updatedAt` (降順) - clubs, users
- `startDate` (昇順) - events
- `isActive` - users

## クエリパターン

### よく使用されるクエリ
```javascript
// 特定グループの今後のイベント取得
db.collection('clubs').doc(clubId).collection('events')
  .where('targetGroupIds', 'array-contains', groupId)
  .where('startDate', '>=', new Date())
  .orderBy('startDate', 'asc')

// アクティブメンバー一覧
db.collection('clubs').doc(clubId).collection('users')
  .where('isActive', '==', true)
  .orderBy('name', 'asc')

// 特定グループ向けの最新メッセージ
db.collection('clubs').doc(clubId).collection('messages')
  .where('targetGroupIds', 'array-contains', groupId)
  .orderBy('createdAt', 'desc')
  .limit(20)
```

## データ制限・考慮事項

### Firestore制限
- ドキュメントサイズ: 最大1MB
- 配列フィールド: 最大20,000要素
- 複合インデックス: 最大40,000エントリ/ドキュメント

### パフォーマンス最適化
- 大きなグループ（500名以上）での一括通知は分割処理
- メッセージの`isRead`マップは定期的にクリーンアップ
- 古い分析データは定期的にアーカイブ