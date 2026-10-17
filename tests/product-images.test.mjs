import test from 'node:test';
import assert from 'node:assert/strict';
import {workbookImages} from '../dist/modules/products/services/workbook-images.js';
test('multiple URLs keep gallery order and deduplicate',()=>assert.deepEqual(workbookImages({'Image URLs':'https://example.com/a.jpg | https://example.com/b.png\nhttps://example.com/a.jpg'},'Pea'),[{url:'https://example.com/a.jpg',alt:'Pea'},{url:'https://example.com/b.png',alt:'Pea'}]));
test('numbered image columns include alt text',()=>assert.deepEqual(workbookImages({'Image 1 URL':'https://example.com/a.jpg','Image 1 Alt':'Front jar','Image 2 URL':'https://example.com/b.jpg'},'Pea'),[{url:'https://example.com/a.jpg',alt:'Front jar'},{url:'https://example.com/b.jpg',alt:'Pea'}]));
test('unsafe protocols are rejected',()=>assert.throws(()=>workbookImages({'Image URLs':'javascript:alert(1)'},'Pea')));
test('missing images keep explicit placeholder',()=>assert.equal(workbookImages({},'Pea')[0].url,'/file.svg'));
test('image count limit is enforced',()=>assert.throws(()=>workbookImages({'Image URLs':Array.from({length:21},(_,i)=>'https://example.com/'+i+'.png').join('|')},'Pea')));
