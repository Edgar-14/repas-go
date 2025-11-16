import{getValidator}from'./validator';

const validator = getValidator();

const ok = { variant: 'light', backgroundColor: '#112233', styles: [] } as any;
console.log('Valid ([]) =>', validator.validate(ok));

const bad = { variant: 'otro', backgroundColor: '123456' } as any;
console.log('Invalid (>=2 issues) =>', validator.validate(bad));
