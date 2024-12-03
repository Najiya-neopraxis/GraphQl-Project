import PageManager from "../../theme/page-manager";
export default class ProductConfigurator extends PageManager {
    constructor(context) {
        super(context);
        console.log(context);
        this.accessToken =context.credential;
        this.productId=context.productId;
    }
    onReady(){
        this.getRelatedProductData();
    }
    getRelatedProductData(){
         console.log(this.accessToken);
        fetch('/graphql', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.accessToken}`,
            },
            body: JSON.stringify({
              query: `query  {
  site {
  product(entityId: ${this.productId}) {
    name
    prices {
      salePrice {
        formatted
      }
    }
    description
    customFields {
      edges {
        node {
          name
          value
        }
      }
    }
    defaultImage {
      urlOriginal
    }
    images {
      edges {
        node {
          urlOriginal
        }
      }
    }
    relatedProducts {
      edges {
        node {
          entityId
          name
          prices {
            salePrice {
              formatted
            }
          }
          defaultImage {
            urlOriginal
          }
        }
      }
    }
  }
}
}`
            })
          })
          .then(res => res.json())
          .then(data => {
            console.log(data);
            
            const productDetails ={
              name:data.data.site.product.name,
              price:data.data.site.product.prices.salePrice.formatted,
              description:data.data.site.product.description, 
              Image:data.data.site.product.defaultImage.urlOriginal,
            }
           console.log("productdetails",productDetails);
          
          const productName =document.querySelector('.product-name');
          productName.innerHTML=`${productDetails.name}`;

          const productPrice =document.querySelector('.product-price');
          productPrice.innerHTML=`${productDetails.price}`;

          const productDescription =document.querySelector('.product-description');
          productDescription.innerHTML=`${productDetails.description}`;

            const productImg = document.querySelector('.cm-main-image-container');
            productImg.innerHTML=`<img src="${productDetails.Image}" alt="imagename">`;
            
                const productImages=data.data.site.product.images.edges;
                console.log("image==",productImages);
              
               const thumbnailImageDiv = document.querySelector('.thumbnailImages-div');

               productImages.forEach((prdctImages) => {
                  const thumbnailImage = prdctImages.node.urlOriginal;
                  console.log("thumbnailImage", thumbnailImage);

                  const divElement = document.createElement('div');
                  divElement.classList.add('product-images');  

                  const imgElement = document.createElement('img');
                  imgElement.src = thumbnailImage;
                  imgElement.alt = "imagename";
                  
                  divElement.appendChild(imgElement);
                  thumbnailImageDiv.appendChild(divElement);


                  imgElement.addEventListener('click', function() {

                    const productImage = document.querySelector('.cm-main-image-container img');
                    if (productImage) {
                        productImage.src = thumbnailImage;  
                    }
                  });
              }); 

              const customFieldContainer = document.querySelector('.custom-field-item');
              const customFields = data.data.site.product.customFields.edges;
              
              customFields.forEach((CmData) => {
                  const customFieldName = CmData.node.name;
                  const customFieldValue = CmData.node.value;
              
                  const divElement = document.createElement('div');
                  divElement.classList.add('custom-field');
              
                  const nameElement = document.createElement('p');
                  nameElement.textContent = `${customFieldName}:`;
                  divElement.appendChild(nameElement);
              
                  const valueElement = document.createElement('p');
                  valueElement.textContent = customFieldValue;
                  divElement.appendChild(valueElement);
              
                  customFieldContainer.appendChild(divElement);
              });
              const relatedProducts = data.data.site.product.relatedProducts.edges;
              const relatedProductData = document.querySelector('.related-products'); 
              
              relatedProducts.forEach(data => {
                const relatedProductName = data.node.name;
                const relatedProductPrice = data.node.prices.salePrice.formatted;
                const relatedProductImage = data.node.defaultImage.urlOriginal;
              
                console.log("relatedProducts", relatedProducts); 

                const divElement = document.createElement('div');
                divElement.classList.add('relProduct');
                const relatedName = document.createElement('p');
                relatedName.classList.add('related_name');
                relatedName.textContent = `${relatedProductName}:`;
                divElement.appendChild(relatedName);
                const priceElement = document.createElement('p');
                priceElement.classList.add('related-Price');
                priceElement.textContent = relatedProductPrice;
                divElement.appendChild(priceElement);
                const imageElement = document.createElement('img');
                imageElement.src = relatedProductImage;
                imageElement.alt = relatedProductName;  
                divElement.appendChild(imageElement);
                relatedProductData.appendChild(divElement);
              });
          }) // will log JSON result to browser console
          .catch(error => console.error(error));
    }
  }

  