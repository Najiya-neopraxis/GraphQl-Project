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
      defaultImage{
        urlOriginal
      }
      images {
        edges {
          node {
            urlOriginal
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
          }) // will log JSON result to browser console
          .catch(error => console.error(error));
    }
  }
  