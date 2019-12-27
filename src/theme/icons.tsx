/* eslint-disable react/display-name */
import SvgIcon, { SvgIconProps } from '@material-ui/core/SvgIcon';
import React from "react";
import { ReactComponent as Account } from './icons/account.svg';
import { ReactComponent as ArrowDown } from './icons/arrow-down.svg';
import { ReactComponent as ArrowLeft } from './icons/arrow-left.svg';
import { ReactComponent as ArrowLeftDouble } from './icons/arrow-left-double.svg';
import { ReactComponent as ArrowRight } from './icons/arrow-right.svg';
import { ReactComponent as ArrowRightDouble } from './icons/arrow-right-double.svg';
import { ReactComponent as Edit } from './icons/edit.svg';
import { ReactComponent as Editor } from './icons/editor.svg';
import { ReactComponent as Close } from './icons/close.svg';
import { ReactComponent as Commit } from './icons/commit.svg';
import { ReactComponent as Faq } from './icons/faq.svg';
import { ReactComponent as FastForward } from './icons/fast-forward.svg';
import { ReactComponent as FastRewind } from './icons/fast-rewind.svg';
import { ReactComponent as Filter } from './icons/filter.svg';
import { ReactComponent as Home } from './icons/home.svg';
import { ReactComponent as IAM } from './icons/iam.svg';
import { ReactComponent as InlineSplit } from './icons/inline-split.svg';
import { ReactComponent as Logout } from './icons/logout.svg';
import { ReactComponent as Menu } from './icons/menu.svg';
import { ReactComponent as Merge } from './icons/merge.svg';
import { ReactComponent as Organization } from './icons/organization.svg';
import { ReactComponent as Profile } from './icons/profile.svg';
import { ReactComponent as Projects } from './icons/projects.svg';
import { ReactComponent as Redo } from './icons/redo.svg';
import { ReactComponent as Save } from './icons/save.svg';
import { ReactComponent as Settings } from './icons/settings.svg';
import { ReactComponent as Split } from './icons/split.svg';
import { ReactComponent as Training } from './icons/training.svg';
import { ReactComponent as Translate } from './icons/translate.svg';
import { ReactComponent as Models } from './icons/models.svg';
import { ReactComponent as More } from './icons/more.svg';
import { ReactComponent as Undo } from './icons/undo.svg';

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
interface ICONS {
  [x: string]: (props: SvgIconProps) => JSX.Element;
}

/**
 * The custom SVG icons for the site
 * - icons are wrapped in a `SvgIcon` component
 * - icons accept `SvgIconProps`
 */
export const ICONS = {
  /**  
   * Used in the menu dropdown
   */
  Account: (props: SvgIconProps) => <SvgIcon viewBox="0 0 20 20" {...props}><Account /></SvgIcon>,
  /**  
   * A downward pointing arrow / wedge `∨`
   */
  ArrowDown: (props: SvgIconProps) => <SvgIcon {...props}><ArrowDown /></SvgIcon>,
  /**  
   * A left pointing arrow / less-than symbol `＜`
   */
  ArrowLeft: (props: SvgIconProps) => <SvgIcon viewBox="0 0 25 24" {...props}><ArrowLeft /></SvgIcon>,
  /**  
   * Two left pointing arrows / less-than symbols `＜＜`
   */
  ArrowLeftDouble: (props: SvgIconProps) => <SvgIcon {...props}><ArrowLeftDouble /></SvgIcon>,
  /**  
   * A right pointing arrow / greater-than symbol `＞`
   */
  ArrowRight: (props: SvgIconProps) => <SvgIcon viewBox="0 0 25 24" {...props}><ArrowRight /></SvgIcon>,
  /**  
   * Two right pointing arrows / greater-than symbols `＞＞`
   */
  ArrowRightDouble: (props: SvgIconProps) => <SvgIcon {...props}><ArrowRightDouble /></SvgIcon>,
  /**  
   * A close / 'x' icon.
   */
  Close: (props: SvgIconProps) => <SvgIcon viewBox="0 0 20 20" {...props}><Close /></SvgIcon>,
  /**  
   * A line with a circle in the center / `-○-`
   */
  Commit: (props: SvgIconProps) => <SvgIcon viewBox="0 0 20 20" {...props}><Commit /></SvgIcon>,
  /**  
   * Pencil icon
   */
  Edit: (props: SvgIconProps) => <SvgIcon {...props}><Edit /></SvgIcon>,
  /**  
   * Used in the drawer
   * - Pencil and paper icon
   */
  Editor: (props: SvgIconProps) => <SvgIcon {...props}><Editor /></SvgIcon>,
  /**  
   * A question mark inside a square
   */
  Faq: (props: SvgIconProps) => <SvgIcon {...props}><Faq /></SvgIcon>,
  /**  
   * Two solid right pointing triangles `▶▶`
   */
  FastForward: (props: SvgIconProps) => <SvgIcon viewBox="0 0 36 36" {...props}><FastForward /></SvgIcon>,
  /**  
   * Two solid left pointing triangles `◀◀`
   */
  FastRewind: (props: SvgIconProps) => <SvgIcon viewBox="0 0 36 36" {...props}><FastRewind /></SvgIcon>,
  /**  
   * A filter symbol
   */
  Filter: (props: SvgIconProps) => <SvgIcon {...props}><Filter /></SvgIcon>,
  /**  
   * A symbol of a house
   */
  Home: (props: SvgIconProps) => <SvgIcon {...props}><Home /></SvgIcon>,
  /**  
   * A symbol of a house
   */
  IAM: (props: SvgIconProps) => <SvgIcon {...props}><IAM /></SvgIcon>,
  /**
   * The inline split button icon for the editor
   * - used between words to split segments
   */
  InlineSplit: (props: SvgIconProps) => <SvgIcon {...props}><InlineSplit /></SvgIcon>,
  /**  
   * A symbol of a door with an arrow left
   */
  Logout: (props: SvgIconProps) => <SvgIcon viewBox="0 0 20 20" {...props}><Logout /></SvgIcon>,
  /**  
   * A menu / hamburger symbol
   */
  Menu: (props: SvgIconProps) => <SvgIcon viewBox="0 0 32 33" {...props}><Menu /></SvgIcon>,
  /**
   * Used in the the editor. An icon of two arrows merging into one.
   */
  Merge: (props: SvgIconProps) => <SvgIcon viewBox="0 0 36 36" {...props}><Merge /></SvgIcon>,
  /**
   * An icon of a cube.
   */
  Models: (props: SvgIconProps) => <SvgIcon {...props}><Models /></SvgIcon>,
  /**
   * Three dots in a vertical line / vertical ellipsis `⋮`
   */
  More: (props: SvgIconProps) => <SvgIcon {...props}><More /></SvgIcon>,
  /**
   * An icon of a multi-story office building
   */
  Organization: (props: SvgIconProps) => <SvgIcon viewBox="0 0 36 36" {...props}><Organization /></SvgIcon>,
  /**
   * An outline of a person in a circle
   */
  Profile: (props: SvgIconProps) => <SvgIcon viewBox="0 0 36 36" {...props}><Profile /></SvgIcon>,
  /**
   * Three hexagons / cube outlines arranged next to each other.
   */
  Projects: (props: SvgIconProps) => <SvgIcon {...props}><Projects /></SvgIcon>,
  /**
   * Used in the the editor. An icon of an arrow that curves right.
   */
  Redo: (props: SvgIconProps) => <SvgIcon viewBox="0 0 36 36" {...props}><Redo /></SvgIcon>,
  /**
   * Used in the the editor. An icon of a floppy disk.
   */
  Save: (props: SvgIconProps) => <SvgIcon viewBox="0 0 36 36" {...props}><Save /></SvgIcon>,
  /**
   * An icon of a gear / cog.
   */
  Settings: (props: SvgIconProps) => <SvgIcon {...props}><Settings /></SvgIcon>,
  /**
   * Used in the the editor. An icon of one arrow splitting into two.
   */
  Split: (props: SvgIconProps) => <SvgIcon viewBox="0 0 36 36" {...props}><Split /></SvgIcon>,
  /**  
   * An icon of a soundwave.
   */
  Training: (props: SvgIconProps) => <SvgIcon {...props}><Training /></SvgIcon>,
  /**  
   * Used in the the header
   */
  Translate: (props: SvgIconProps) => <SvgIcon {...props}><Translate /></SvgIcon>,
  /**
   * Used in the the editor. An icon of an arrow that curves left.
   */
  Undo: (props: SvgIconProps) => <SvgIcon viewBox="0 0 36 36" {...props}><Undo /></SvgIcon>,
};
