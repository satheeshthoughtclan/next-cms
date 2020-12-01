
import React, { useState } from 'react'
import { TinaCMS, useCMS } from 'tinacms'
import GithubErrorModal, { GithubError } from 'react-tinacms-github'
import { CreateForkModal, GithubAuthenticationModal } from 'react-tinacms-github'
import { GithubClient } from 'react-tinacms-github'
import { useCMSEvent } from 'tinacms'

interface ProviderProps {
  children: any
  onLogin: () => void
  onLogout: () => void
  error?: any
}

type ModalNames = null | 'authenticate' | 'createFork'

export const CustomGithubProvider = ({
  children,
  onLogin,
  onLogout,
  error: previewError,
}: ProviderProps) => {
  const [error, setError] = useState<GithubError>(previewError)
  const cms = useCMS()
  const github: GithubClient = cms.api.github
  const [activeModal, setActiveModal] = useState<ModalNames>(null)

  const onClose = async () => {
    setActiveModal(null)
    if (!(await github.isAuthorized())) {
      cms.disable()
    }
  }

  const beginAuth = async () => {
    if (await github.isAuthenticated()) {
      onAuthSuccess()
    } else {
      setActiveModal('authenticate')
    }
  }

  const onAuthSuccess = async () => {
    if (await github.isAuthorized()) {
      github.checkout(github.branchName, github.baseRepoFullName)
      onLogin();
      setActiveModal(null)
    } else {
      setActiveModal('createFork')
    }
  }

  useCMSEvent(TinaCMS.ENABLED.type, beginAuth, [])
  useCMSEvent(TinaCMS.DISABLED.type, onLogout, [])
  useCMSEvent("github:branch:checkout", onLogin, [])
  useCMSEvent("github:error", ({ error }: any) => setError(error), [])

  return (
    <>
      {!error && activeModal === 'authenticate' && (
        <GithubAuthenticationModal
          close={onClose}
          onAuthSuccess={onAuthSuccess}
        />
      )}
      {!error && activeModal === 'createFork' && (
        <CreateForkModal close={onClose} onForkCreated={onLogin} />
      )}
      {!previewError && children}
    </>
  )
}
