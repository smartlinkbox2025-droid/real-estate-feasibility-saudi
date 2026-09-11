from pathlib import Path

p = Path('artifacts/real-estate-feasibility/src/App.tsx')
s = p.read_text()

old = '''            <Field label="إجمالي مساحة الأدوار المتكررة الفعلية" hint="إجمالي جميع الأدوار المتكررة من الرخصة"><div className="input-with-unit"><input className="number-input" type="number" min="0" step="0.01" value={project.compliance.actualRepeatedFloorsTotalArea || ''} onChange={(event) => patchNested('compliance', { actualRepeatedFloorsTotalArea: Number(event.target.value) || 0 })} placeholder="٠" data-testid="input-actual-repeated-total-area" /><span className="input-unit">م²</span></div></Field>
            <Field label="مساحة الملحق الفعلية" hint="تستخدم عند تفعيل الملحق"><div className="input-with-unit"><input className="number-input" type="number" min="0" step="0.01" value={project.compliance.actualAnnexArea || ''} onChange={(event) => patchNested('compliance', { actualAnnexArea: Number(event.target.value) || 0 })} placeholder="٠" data-testid="input-actual-annex-area" /><span className="input-unit">م²</span></div></Field>
'''
new = '''            <Field label="إجمالي مساحة الأدوار المتكررة الفعلية" hint="إجمالي جميع الأدوار المتكررة من الرخصة"><div className="input-with-unit"><input className="number-input" type="number" min="0" step="0.01" value={project.compliance.actualRepeatedFloorsTotalArea || ''} onChange={(event) => patchNested('compliance', { actualRepeatedFloorsTotalArea: Number(event.target.value) || 0 })} placeholder="٠" data-testid="input-actual-repeated-total-area" /><span className="input-unit">م²</span></div></Field>
            <Field label="عدد الأدوار المتكررة" hint="مطلوب لحساب مساحة الدور المتكرر الواحد">
              <input className="number-input" type="number" min="0" step="1" value={project.compliance.repeatedFloors || ''} onChange={(event) => patchNested('compliance', { repeatedFloors: Number(event.target.value) || 0 })} placeholder="٠" data-testid="input-permit-repeated-floors" />
            </Field>
            <Field label="مساحة الملحق الفعلية" hint="إدخال مساحة أكبر من صفر يفعّل الملحق تلقائياً"><div className="input-with-unit"><input className="number-input" type="number" min="0" step="0.01" value={project.compliance.actualAnnexArea || ''} onChange={(event) => { const area = Number(event.target.value) || 0; patchNested('compliance', { actualAnnexArea: area, annexEnabled: area > 0 ? true : project.compliance.annexEnabled }); }} placeholder="٠" data-testid="input-actual-annex-area" /><span className="input-unit">م²</span></div></Field>
'''
if s.count(old) != 1:
    raise SystemExit(f'permit fields anchor count={s.count(old)}')
s = s.replace(old, new, 1)
p.write_text(s)
print('Permit summary display fix applied')
