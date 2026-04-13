import mongoose, { Schema, Document } from 'mongoose'
import { Identity as IIdentity, IdentityAttribute, Verification } from '@decentralized-identity/shared'

interface IdentityDocument extends IIdentity, Document {}

const AttributeSchema = new Schema<IdentityAttribute>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  value: { type: String, required: true },
  type: { type: String, required: true, enum: ['email', 'phone', 'name', 'date_of_birth', 'address', 'government_id', 'education', 'employment', 'custom'] },
  encrypted: { type: Boolean, default: false },
  verified: { type: Boolean, default: false },
  verificationId: { type: String },
  createdAt: { type: Date, default: Date.now },
}, { _id: false })

const VerificationSchema = new Schema<Verification>({
  id: { type: String, required: true },
  attributeId: { type: String, required: true },
  verifier: { type: String, required: true },
  verificationMethod: { type: String, required: true, enum: ['passkey', 'document', 'biometric', 'third_party', 'zero_knowledge'] },
  verifiedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
  proof: { type: String, required: true },
  metadata: { type: Schema.Types.Mixed },
}, { _id: false })

const IdentitySchema = new Schema<IdentityDocument>({
  id: { type: String, required: true, unique: true },
  publicKey: { type: String, required: true, unique: true },
  stellarAddress: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  attributes: [AttributeSchema],
  verifications: [VerificationSchema],
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret._id
      delete ret.__v
      return ret
    }
  }
})

// Indexes for better performance
IdentitySchema.index({ publicKey: 1 })
IdentitySchema.index({ stellarAddress: 1 })
IdentitySchema.index({ 'attributes.id': 1 })
IdentitySchema.index({ 'verifications.id': 1 })

export const IdentityModel = mongoose.model<IdentityDocument>('Identity', IdentitySchema)
