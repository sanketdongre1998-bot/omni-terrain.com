(() => {
  'use strict';

  /*
    Car-Part Pro / supplier adapter contract.

    Replace this stub when the live inventory API is ready. Keep the public
    interface stable so the storefront does not need to change again.

    Expected implementation:
      window.OMNI_USED_PARTS_PROVIDER = {
        ready: true,
        name: 'Car-Part Pro',
        async search({ part, year, make, model, category }) {
          return {
            items: [
              {
                id: 'supplier-stock-id',
                partNumber: 'FP5T-18C808-AA',
                title: 'Used OEM Amplifier',
                year: '2016',
                make: 'Ford',
                model: 'F-150',
                category: 'Audio & Infotainment',
                condition: 'Used',
                conditionNote: 'See source notes',
                price: 189.95,
                currency: 'USD',
                image: '/path/to/actual-photo.jpg',
                sourceRef: 'yard/reference',
                handling: 'Shown after source confirmation',
                url: '/used-part.html?...'
              }
            ],
            total: 1
          };
        }
      };
  */

  if (!window.OMNI_USED_PARTS_PROVIDER) {
    window.OMNI_USED_PARTS_PROVIDER = {
      ready: false,
      name: 'Inventory connection pending',
      async search() {
        return { items: [], total: 0, connected: false };
      }
    };
  }
})();
