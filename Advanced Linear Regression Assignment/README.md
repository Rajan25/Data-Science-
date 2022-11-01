# House Price Prediction
> To identify impact factors that drive the sale price of houses


## Table of Contents
* Data Understanding, Data Cleaning & Preparation, Model buliding and evaluation, Inference.
* Python
* Performed Ridge and Lasso Regression for coming up with the top factors

## General Information
- The project is created on a python notebook which identifies through multiple exploratory analysis steps the impact of various factors on the probability of repayment of a loan. 


## Conclusions
###Postive Factors -
- GrLivArea(0.216) : Greater living area definitely will lead to higher selling price hence its has highest weight
- TotalBsmtSF(0.107) : Hihger basement square feet area is surely likeable and hence better Saleprice
- BsmtFinSF1(0.053) : Higher finished basemnt areas obviously is preferable and leads to higher Saleprice
- CentralAir_Y(0.047) : Air conditioning is always preferable for inhibitants hence leads to higher SalePrice
- SaleType_New(0.037) : New constructed houses are always in demand hence leads to higher Sale price
### Negative Factors -
- GarageType_NA(-0.030) : If a house doesnt have garage , it definitely pull the house price which is what suggested by our model as it is the feature with highest -ve impact on Sale Price
- FireplaceQu_NA(-0.020) : In US temparatures can go very low as well, so not having a fireplace definitely is a negative factor in terms of demand for a house
- PropAge(-0.020) : Higher property age means the house is older hence pulling down the sale price makes sense
## Technologies Used
- Python - version 1.1.3
- matplotlib - version 3.3.2

## Acknowledgements
- This project was developed as part of the master's program at IIIT B and LJMU. 


## Contact
Created by [@Rajan25] - feel free to contact me at rajanraju25@gmail.com
