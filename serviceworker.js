//List List service worker for offline application
//Version 1.20180805
self.addEventListener('install', function(event){
	event.waitUntil(
		caches.open('v1.0.0').then(function(cache){
			return cache.addAll([
				'/list-list/',
				'/list-list/style.css',
				'/list-list/index.html',
				'/list-list/app.js',
				'/list-list/localstoragedb.min.js'
			]);
		})
	);
});
self.addEventListener('activate', function(event){
	event.waitUntil(
		caches.keys().then(function(cacheNames){
			caches.delete('v1');
			caches.delete('v2');
			caches.delete('v3');
		})
	)
});
self.addEventListener('fetch', function(event) {
  event.respondWith(
	    caches.match(event.request)
  );
});
