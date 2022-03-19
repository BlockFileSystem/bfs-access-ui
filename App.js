import React, { Component } from 'react';
import Web3 from 'web3'
import './App.css';
import validator from 'validator';
import BfsAccess from '../abis/BfsAccess.json'
import BFS_Logo from '../BFS_Logo.png'
import BFS_icon from '../BFS_icon.png'
import kawai_noBfsAccess from '../kawai_noBfsAccess.png'
import metamask_not_connected from '../metamask_not_connected.png'
import ErrorSmartContract from '../ErrorSmartContract.png'


class App extends Component {

  async componentWillMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()
  }

  async loadWeb3() {
    const noNetwork = true
    this.setState({noNetwork})

    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      //await window.ethereum.enable()
      await window.ethereum.request({method: 'eth_requestAccounts'})
    }
    //else if (window.web3) {
    //  window.web3 = new Web3(window.web3.currentProvider)
    //}
    else {
      this.setState({noNetwork : true})
    }
  }

  async loadBlockchainData() {

    const web3 = window.web3
    const displayMint = true
    this.setState({displayMint : false})

    if(web3) {
      this.setState({noNetwork : false})
      const noSmartContract = false
      this.setState({noSmartContract})
      // Load account
      //const accounts = await web3.eth.getAccounts()
      const accounts = await web3.eth.requestAccounts()
      this.setState({ account: accounts[0] })
      const networkId = await web3.eth.net.getId()
      const networkData = BfsAccess.networks[networkId]
      if(networkData) {
        const displayMint = true
        this.setState({displayMint})
        const abi = BfsAccess.abi
        const address = networkData.address
        const contract = new web3.eth.Contract(abi, address)
        this.setState({ contract })

        // Ajout affiche le nombre de NFT dans la wallet connectée
        const balanceOf = await contract.methods.balanceOf(this.state.account).call()
        this.setState({ balanceOf })
      
        // Load bfs-access of owner address and bfsIds of owner address
        if(balanceOf == 0){
          const accessId = false
          this.setState({
            accessIds: [...this.state.accessIds, accessId]
          })
        
        }else {

          for (var i = 0; i < balanceOf; i++) {
            const accessId = await contract.methods.uriOfOwnerByIndex(this.state.account, i).call()
            const bfsId = await contract.methods.tokenOfOwnerByIndex(this.state.account, i).call()
            this.setState({
              accessIds: [...this.state.accessIds, accessId]
            })
            this.setState({
              //bfsIds: [...this.state.bfsIds, bfsId.toNumber()]
              bfsIds: [...this.state.bfsIds, parseInt(bfsId)]
            })
          }
          
        }
      
      } else {
        this.setState({noSmartContract : true})
        console.log("noSmartContract (else networkdata) : " + this.state.noSmartContract)
      }
    } 
  }

  mint = (accessId) => {    
    if (validator.isURL(accessId,{require_protocol: true})) {
      this.state.contract.methods.mint(accessId).send({ from: this.state.account })
      .once('receipt', (receipt) => {
        this.setState({
          accessIds: [...this.state.accessIds, accessId]
        })
      })
    } else {
       window.alert('Invalid URL')
    }
  }

  constructor(props) {
    super(props)
    this.state = {
      account: '',
      contract: null,
      totalSupply: 0,
      accessIds: [],
      jsonData: [],
      bfsIds: []
    }
  }

  render() {
    const noNetwork = this.state.noNetwork;
    const noSmartContract = this.state.noSmartContract
    const displayMint = this.state.displayMint  

    return (
      <div>
        <nav className="navbar navbar-dark fixed-top flex-md-nowrap p-0 shadow">
          <a
            className="navbar-brand col-sm-3 col-md-2 mr-0"
            href="."
            
            rel="noopener noreferrer"
          >
            BFS-Access [beta]
          </a>
          <ul className="navbar-nav px-3">
            <li className="nav-item text-nowrap d-none d-sm-none d-sm-block">
              <small className="text-white"><span id="account">{this.state.account}</span></small>
            </li>
          </ul>
        </nav>
        
        <div className="container-fluid mt-5 col-sm-9">
          <div className="">
            <main role="main" className="col-sm-12 text-center">
              <div className="content mr-auto ml-auto">
                <img src={BFS_Logo} width="300" height="300" className="align-top" alt="" />
                <form onSubmit={(event) => {
                  event.preventDefault()
                  const accessId = this.accessId.value
                  this.mint(accessId)
                }}>
                 <div> {displayMint == true && 
                  <input
                    type='text'
                    maxLength='100'
                    className='form-control mb-3'
                    placeholder='JSON file location (e.g. https://ipfs.io/ipfs/IPFS_Hash)'
                    required
                    ref={(input) => { this.accessId = input }}
                  /> }</div>
                  
                  <div> {displayMint == true  && 
                  <input
                    type='submit'
                    className='button btn btn-primary'
                    value='MINT'
                  /> }</div>
                </form>
              </div>
            </main>
          </div>
          <div className="separator" ></div>
          <div> {noNetwork == true && <div className="error col-md-12 mb-12"><img className="nonEthereumBrowser" src={metamask_not_connected} alt="" /><div>Metamask is not connected !</div><br/><br/></div>} </div>
          <div> {noSmartContract == true && <div className="error col-md-12 mb-12"><img className="nonEthereumBrowser" src={ErrorSmartContract} alt="" /><div>Smart contract not deployed to detected network.</div><br/><br/></div>} </div>
          <div className="row text-center">
            { this.state.accessIds.map((accessId, key) => { 
              const bfsIds = this.state.bfsIds
              if(!accessId) {return (<div key={key} className="col-md-12 mb-12"><img className="noBfsAccess" src={kawai_noBfsAccess} alt="" /><div><br/>looks like you have no BFS-Access in this wallet.</div></div>)}
              return(
                <div key={key} className="col-md-6 mb-6" >
                  <br/><div className="token3" style={{ backgroundColor: "#6c25be" }}><img className="unlock" src={BFS_icon} alt="" /><div className="id"><b>BFS-Access #{bfsIds[key]}</b></div><div className="token2" style={{ backgroundColor: "" }}><div className="accessId"><b>METADATA<a href={accessId}><br/>{accessId.substring(0,27)}...{accessId.substring(52,67)}</a></b></div><div className="token" style={{ backgroundColor: "" }}><div className="ownerAddress"><b>Ownersip Address</b> {this.state.account}</div></div></div></div>
                    
                </div>
              )
            })}
          </div>
        </div>
      </div>
    );
  }
}

export default App;
