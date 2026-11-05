// The <script> tag the generated demo and docs pages use to load jsondeck:
// over http(s) the split build (dist/jsondeck.js, which loads only the parts a
// page uses), from file:// the single offline file (dist/jsondeck.full.js),
// because browsers block module loading on file:// pages. document.write keeps
// it a normal blocking script, so the inline scripts after it run in order.
//   jsondeckScript("../")  ->  for a page one folder below the repo root
export const jsondeckScript = (rel) =>
	`<script>document.write('<script src="${rel}dist/jsondeck' + (location.protocol === 'file:' ? '.full' : '') + '.js"><\\/script>')</script>`
